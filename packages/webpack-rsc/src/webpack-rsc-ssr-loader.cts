import generate = require('@babel/generator');
import parser = require('@babel/parser');
import traverse = require('@babel/traverse');
import t = require('@babel/types');
import webpack = require('webpack');
import type {ServerReferencesMap} from './webpack-rsc-server-loader.cjs';

namespace webpackRscSsrLoader {
  export interface WebpackRscSsrLoaderOptions {
    readonly serverReferencesMap: ServerReferencesMap;
  }
}

const webpackRscSsrLoader: webpack.LoaderDefinitionFunction<webpackRscSsrLoader.WebpackRscSsrLoaderOptions> =
  function (source, sourceMap) {
    this.cacheable(true);

    const {serverReferencesMap} = this.getOptions();
    const serverReferenceExportNames: string[] = [];
    const resourcePath = this.resourcePath;

    const ast = parser.parse(source, {
      sourceType: `module`,
      sourceFilename: resourcePath,
      plugins: [`importAssertions`],
    });

    let hasUseServerDirective = false;

    traverse.default(ast, {
      enter(path) {
        const {node} = path;

        if (t.isProgram(node)) {
          if (node.directives.some(isUseServerDirective)) {
            hasUseServerDirective = true;
          } else {
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
          serverReferenceExportNames.push(exportName);
        } else {
          path.remove();
        }
      },
    });

    if (!hasUseServerDirective) {
      return this.callback(null, source, sourceMap);
    }

    if (serverReferenceExportNames.length > 0) {
      serverReferencesMap.set(resourcePath, {
        exportNames: serverReferenceExportNames,
      });
    }

    const {code, map} = generate.default(
      ast,
      {
        sourceFileName: this.resourcePath,
        sourceMaps: this.sourceMap,
        // @ts-expect-error
        inputSourceMap: sourceMap,
      },
      source,
    );

    this.callback(null, code, map ?? sourceMap);
  };

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

export = webpackRscSsrLoader;
