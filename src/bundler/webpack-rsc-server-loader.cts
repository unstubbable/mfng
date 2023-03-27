import generate from '@babel/generator';
import {parse} from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type {LoaderContext} from 'webpack';
import {relative} from 'path';

export interface WebpackRscServerLoaderOptions {
  readonly clientReferencesForClientMap: ClientReferencesForClientMap;
}

export type ClientReferencesForClientMap = Map<
  string,
  ClientReferenceForClient[]
>;

export interface ClientReferenceForClient {
  readonly id: string;
  readonly exportName: string;
}

export default webpackRscServerLoader;

export function webpackRscServerLoader(
  this: LoaderContext<WebpackRscServerLoaderOptions>,
  source: string,
): void {
  this.cacheable(true);

  const {clientReferencesForClientMap} = this.getOptions();
  const resourcePath = this.resourcePath;

  const ast = parse(source, {
    sourceType: `module`,
    sourceFilename: resourcePath,
  });

  const clientReferences: ClientReferenceForClient[] = [];

  traverse(ast, {
    enter(path) {
      const {node} = path;

      if (t.isProgram(node)) {
        if (!node.directives.some(isUseClientDirective)) {
          path.skip();
        }

        return;
      }

      if (t.isDirective(node) && isUseClientDirective(node)) {
        path.skip();
        return;
      }

      const exportName = getExportName(node);

      if (exportName) {
        const id = `${relative(process.cwd(), resourcePath)}#${exportName}`;

        clientReferences.push({id, exportName});
        path.replaceWith(createExportedClientReference(id, exportName));
        path.skip();
      } else {
        path.remove();
      }
    },
  });

  if (clientReferences.length > 0) {
    clientReferencesForClientMap.set(resourcePath, clientReferences);
  }

  const {code} = generate(ast, {sourceFileName: this.resourcePath});

  // TODO: Handle source maps.

  this.callback(null, code);
}

function isUseClientDirective(directive: t.Directive): boolean {
  return (
    t.isDirectiveLiteral(directive.value) &&
    directive.value.value === `use client`
  );
}

function getExportName(node: t.Node): string | undefined {
  if (t.isExportNamedDeclaration(node)) {
    if (t.isFunctionDeclaration(node.declaration)) {
      return node.declaration.id?.name;
    }

    if (t.isVariableDeclaration(node.declaration)) {
      const id = node.declaration.declarations[0]?.id;

      return t.isIdentifier(id) ? id.name : undefined;
    }
  }

  return undefined;
}

function createExportedClientReference(
  id: string,
  exportName: string,
): t.ExportNamedDeclaration {
  return t.exportNamedDeclaration(
    t.variableDeclaration(`const`, [
      t.variableDeclarator(
        t.identifier(exportName),
        t.objectExpression([
          t.objectProperty(
            t.identifier(`$$typeof`),
            createReferenceSymbol(`client`),
          ),
          t.objectProperty(t.identifier(`$$id`), t.stringLiteral(id)),
        ]),
      ),
    ]),
  );
}

function createReferenceSymbol(type: `client` | `server`): t.CallExpression {
  return t.callExpression(
    t.memberExpression(t.identifier(`Symbol`), t.identifier(`for`)),
    [t.stringLiteral(`react.${type}.reference`)],
  );
}
