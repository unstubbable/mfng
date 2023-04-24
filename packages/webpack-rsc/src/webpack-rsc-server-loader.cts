/* eslint-disable import/no-commonjs, @typescript-eslint/no-require-imports */

import path = require('path');
import generate = require('@babel/generator');
import parser = require('@babel/parser');
import traverse = require('@babel/traverse');
import t = require('@babel/types');
import type {LoaderContext} from 'webpack';

namespace webpackRscServerLoader {
  export interface WebpackRscServerLoaderOptions {
    readonly clientReferencesMap: ClientReferencesMap;
  }

  export type ClientReferencesMap = Map<string, ClientReference[]>;

  export interface ClientReference {
    readonly id: string;
    readonly exportName: string;
    ssrId?: string | number;
  }
}

function webpackRscServerLoader(
  this: LoaderContext<webpackRscServerLoader.WebpackRscServerLoaderOptions>,
  source: string,
): void {
  this.cacheable(true);

  const {clientReferencesMap} = this.getOptions();
  const resourcePath = this.resourcePath;

  const ast = parser.parse(source, {
    sourceType: `module`,
    sourceFilename: resourcePath,
  });

  let hasUseClientDirective = false;
  const clientReferences: webpackRscServerLoader.ClientReference[] = [];

  traverse.default(ast, {
    enter(nodePath) {
      const {node} = nodePath;

      if (t.isProgram(node)) {
        if (node.directives.some(isUseClientDirective)) {
          hasUseClientDirective = true;
        } else {
          nodePath.skip();
        }

        return;
      }

      if (t.isDirective(node) && isUseClientDirective(node)) {
        nodePath.skip();

        return;
      }

      const exportName = getExportName(node);

      if (exportName) {
        const id = `${path.relative(
          process.cwd(),
          resourcePath,
        )}#${exportName}`;

        clientReferences.push({id, exportName});
        nodePath.replaceWith(createExportedClientReference(id, exportName));
        nodePath.skip();
      } else {
        nodePath.remove();
      }
    },
  });

  if (!hasUseClientDirective) {
    return this.callback(null, source);
  }

  if (clientReferences.length > 0) {
    clientReferencesMap.set(resourcePath, clientReferences);
  }

  const {code} = generate.default(ast, {sourceFileName: this.resourcePath});

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
            t.callExpression(
              t.memberExpression(t.identifier(`Symbol`), t.identifier(`for`)),
              [t.stringLiteral(`react.client.reference`)],
            ),
          ),
          t.objectProperty(t.identifier(`$$id`), t.stringLiteral(id)),
        ]),
      ),
    ]),
  );
}

export = webpackRscServerLoader;
