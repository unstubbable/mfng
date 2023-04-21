import generate from '@babel/generator';
import {parse} from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type {LoaderContext, LoaderDefinitionFunction} from 'webpack';

export interface WebpackRscClientLoaderOptions {
  readonly serverReferencesMap: ServerReferencesMap;
  readonly callServerImportSource?: string;
}

export type ServerReferencesMap = Map<string, ServerReferencesModuleInfo>;

export interface ServerReferencesModuleInfo {
  readonly moduleId: string | number;
  readonly exportNames: string[];
}

type SourceMap = Parameters<LoaderDefinitionFunction>[1];

export default function webpackRscClientLoader(
  this: LoaderContext<WebpackRscClientLoaderOptions>,
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

  const ast = parse(source, {
    sourceType: `module`,
    sourceFilename: resourcePath,
  });

  let hasUseServerDirective = false;

  traverse(ast, {
    Program(path) {
      const {node} = path;

      if (!node.directives.some(isUseServerDirective)) {
        return;
      }

      hasUseServerDirective = true;

      const moduleInfo = serverReferencesMap.get(resourcePath);

      if (!moduleInfo) {
        loaderContext.emitError(
          new Error(
            `Could not find server references module info in \`serverReferencesMap\` for ${resourcePath}.`,
          ),
        );

        path.replaceWith(t.program([]));

        return;
      }

      const {moduleId, exportNames} = moduleInfo;

      path.replaceWith(
        t.program([
          t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier(`createServerReference`),
                t.identifier(`createServerReference`),
              ),
            ],
            t.stringLiteral(`react-server-dom-webpack/client`),
          ),
          t.importDeclaration(
            [
              t.importSpecifier(
                t.identifier(`callServer`),
                t.identifier(`callServer`),
              ),
            ],
            t.stringLiteral(callServerImportSource),
          ),
          ...exportNames.map((exportName) =>
            t.exportNamedDeclaration(
              t.variableDeclaration(`const`, [
                t.variableDeclarator(
                  t.identifier(exportName),
                  t.callExpression(t.identifier(`createServerReference`), [
                    t.stringLiteral(`${moduleId}#${exportName}`),
                    t.identifier(`callServer`),
                  ]),
                ),
              ]),
            ),
          ),
        ]),
      );
    },
  });

  if (!hasUseServerDirective) {
    return this.callback(null, source, sourceMap);
  }

  // TODO: Handle source maps.

  const {code} = generate(ast, {sourceFileName: this.resourcePath});

  this.callback(null, code);
}

function isUseServerDirective(directive: t.Directive): boolean {
  return (
    t.isDirectiveLiteral(directive.value) &&
    directive.value.value === `use server`
  );
}
