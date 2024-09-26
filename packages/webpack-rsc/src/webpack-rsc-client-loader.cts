import generate = require('@babel/generator');
import parser = require('@babel/parser');
import traverse = require('@babel/traverse');
import t = require('@babel/types');
import type {LoaderContext, LoaderDefinitionFunction} from 'webpack';
import type webpackRscServerLoader from './webpack-rsc-server-loader.cjs';

namespace webpackRscClientLoader {
  export interface WebpackRscClientLoaderOptions {
    readonly serverReferencesMap: webpackRscServerLoader.ServerReferencesMap;
    readonly callServerImportSource?: string;
  }
}

type SourceMap = Parameters<LoaderDefinitionFunction>[1];

interface FunctionInfo {
  readonly exportName: string;
  readonly loc: t.SourceLocation | null | undefined;
}

function webpackRscClientLoader(
  this: LoaderContext<webpackRscClientLoader.WebpackRscClientLoaderOptions>,
  source: string,
  sourceMap?: SourceMap,
): void {
  this.cacheable(true);

  const {
    serverReferencesMap,
    callServerImportSource = `@mfng/core/client/browser`,
  } = this.getOptions();

  const loaderContext = this;
  const resourcePath = this.resourcePath;

  const ast = parser.parse(source, {
    sourceType: `module`,
    sourceFilename: resourcePath,
    plugins: [`importAssertions`],
  });

  let moduleId: string | number | undefined;
  let hasUseServerDirective = false;
  let addedRegisterServerReferenceCall = false;
  const importNodes = new Set<t.Node>();

  traverse.default(ast, {
    enter(path) {
      const {node} = path;

      if (t.isProgram(node)) {
        if (node.directives.some(isUseServerDirective)) {
          hasUseServerDirective = true;

          const moduleInfo = serverReferencesMap.get(resourcePath);

          if (!moduleInfo) {
            loaderContext.emitError(
              new Error(
                `Could not find server references module info in \`serverReferencesMap\` for ${resourcePath}.`,
              ),
            );

            path.replaceWith(t.program([]));
          } else if (!moduleInfo.moduleId) {
            loaderContext.emitError(
              new Error(
                `Could not find server references module ID in \`serverReferencesMap\` for ${resourcePath}.`,
              ),
            );

            path.replaceWith(t.program([]));
          } else {
            moduleId = moduleInfo.moduleId;
          }
        } else {
          path.skip();
        }

        return;
      }

      if (importNodes.has(node)) {
        return path.skip();
      }

      const functionInfo = getFunctionInfo(node);

      if (moduleId && functionInfo) {
        path.replaceWith(
          createNamedExportedServerReference(functionInfo, moduleId),
        );
        path.skip();
        addedRegisterServerReferenceCall = true;
      } else {
        path.remove();
      }
    },
    exit(path) {
      if (!t.isProgram(path.node) || !addedRegisterServerReferenceCall) {
        path.skip();

        return;
      }

      importNodes.add(
        t.importDeclaration(
          [
            t.importSpecifier(
              t.identifier(`createServerReference`),
              t.identifier(`createServerReference`),
            ),
          ],
          t.stringLiteral(`react-server-dom-webpack/client`),
        ),
      );

      importNodes.add(
        t.importDeclaration(
          [
            t.importSpecifier(
              t.identifier(`callServer`),
              t.identifier(`callServer`),
            ),
            t.importSpecifier(
              t.identifier(`findSourceMapUrl`),
              t.identifier(`findSourceMapUrl`),
            ),
          ],
          t.stringLiteral(callServerImportSource),
        ),
      );

      (path as traverse.NodePath<t.Program>).unshiftContainer(
        `body`,
        Array.from(importNodes),
      );
    },
  });

  if (!hasUseServerDirective) {
    return this.callback(null, source, sourceMap);
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
}

function createNamedExportedServerReference(
  functionInfo: FunctionInfo,
  moduleId: string | number,
) {
  const {exportName, loc} = functionInfo;
  const exportIdentifier = t.identifier(exportName);

  exportIdentifier.loc = loc;

  return t.exportNamedDeclaration(
    t.variableDeclaration(`const`, [
      t.variableDeclarator(
        exportIdentifier,
        t.callExpression(t.identifier(`createServerReference`), [
          t.stringLiteral(`${moduleId}#${exportName}`),
          t.identifier(`callServer`),
          t.identifier(`undefined`), // encodeFormAction
          t.identifier(`findSourceMapUrl`),
          t.stringLiteral(exportName),
        ]),
      ),
    ]),
  );
}

function isUseServerDirective(directive: t.Directive): boolean {
  return (
    t.isDirectiveLiteral(directive.value) &&
    directive.value.value === `use server`
  );
}

function getFunctionInfo(node: t.Node): FunctionInfo | undefined {
  let exportName: string | undefined;
  let loc: t.SourceLocation | null | undefined;

  if (t.isExportNamedDeclaration(node)) {
    if (t.isFunctionDeclaration(node.declaration)) {
      exportName = node.declaration.id?.name;
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
        exportName = declarator.id.name;
        loc = declarator.id.loc;
      }
    }
  }

  return exportName ? {exportName, loc} : undefined;
}

export = webpackRscClientLoader;
