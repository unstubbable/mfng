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

interface FunctionInfo {
  readonly exportName: string;
  readonly loc: t.SourceLocation | null | undefined;
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

        const functionInfo = getFunctionInfo(node);

        if (functionInfo) {
          path.replaceWith(createExportedServerReferenceStub(functionInfo));
          path.skip();
          serverReferenceExportNames.push(functionInfo.exportName);
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

function getFunctionInfo(node: t.Node): FunctionInfo | undefined {
  let localName: string | undefined;
  let loc: t.SourceLocation | null | undefined;

  if (t.isExportNamedDeclaration(node)) {
    if (t.isFunctionDeclaration(node.declaration)) {
      localName = node.declaration.id?.name;
      loc = node.declaration.id?.loc;
    } else if (t.isVariableDeclaration(node.declaration)) {
      const declarator = node.declaration.declarations[0];

      if (!declarator) {
        return undefined;
      }

      if (
        (t.isFunctionExpression(declarator.init) ||
          t.isArrowFunctionExpression(declarator.init)) &&
        t.isIdentifier(declarator.id)
      ) {
        localName = declarator.id.name;
        loc = declarator.id.loc;
      }
    }
  }

  return localName ? {exportName: localName, loc} : undefined;
}

function createExportedServerReferenceStub(
  functionInfo: FunctionInfo,
): t.ExportNamedDeclaration {
  const identifier = t.identifier(functionInfo.exportName);

  identifier.loc = functionInfo.loc;

  return t.exportNamedDeclaration(
    t.functionDeclaration(
      identifier,
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
