import generate from '@babel/generator';
import {parse} from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type {LoaderContext} from 'webpack';

export default function webpackRscSsrLoader(
  this: LoaderContext<{}>,
  source: string,
): void {
  this.cacheable(true);

  const resourcePath = this.resourcePath;

  const ast = parse(source, {
    sourceType: `module`,
    sourceFilename: resourcePath,
  });

  traverse(ast, {
    enter(path) {
      const {node} = path;

      if (t.isProgram(node)) {
        if (!node.directives.some(isUseServerDirective)) {
          path.skip();
        }

        return;
      }

      if (t.isDirective(node) && isUseServerDirective(node)) {
        path.skip();

        return;
      }

      const exportName = getFunctionExportName(node);

      if (exportName) {
        path.replaceWith(createExportedServerReferenceStub(exportName));
        path.skip();
      } else {
        path.remove();
      }
    },
  });

  const {code} = generate(ast, {sourceFileName: this.resourcePath});

  // TODO: Handle source maps.

  this.callback(null, code);
}

function isUseServerDirective(directive: t.Directive): boolean {
  return (
    t.isDirectiveLiteral(directive.value) &&
    directive.value.value === `use server`
  );
}

function getFunctionExportName(node: t.Node): string | undefined {
  if (t.isExportNamedDeclaration(node)) {
    if (t.isFunctionDeclaration(node.declaration)) {
      return node.declaration.id?.name;
    }

    if (t.isVariableDeclaration(node.declaration)) {
      const declarator = node.declaration.declarations[0];

      if (!declarator) {
        return undefined;
      }

      if (
        t.isFunctionExpression(declarator.init) ||
        t.isArrowFunctionExpression(declarator.init)
      ) {
        return t.isIdentifier(declarator.id) ? declarator.id.name : undefined;
      }
    }
  }

  return undefined;
}

function createExportedServerReferenceStub(
  exportName: string,
): t.ExportNamedDeclaration {
  return t.exportNamedDeclaration(
    t.functionDeclaration(
      t.identifier(exportName),
      [],
      t.blockStatement([
        t.throwStatement(
          t.newExpression(t.identifier(`Error`), [
            t.stringLiteral(
              `Server actions must not be called during server-side rendering.`,
            ),
          ]),
        ),
      ]),
    ),
  );
}
