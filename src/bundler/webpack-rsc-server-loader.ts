import babelGenerate from '@babel/generator';
import {parse} from '@babel/parser';
import babelTraverse from '@babel/traverse';
import * as t from '@babel/types';
import type {RawSourceMap} from 'source-map';
import {SourceMapConsumer, SourceMapGenerator} from 'source-map';
import type {LoaderDefinitionFunction} from 'webpack';

// TODO: Remove when @types/babel__traverse has type=module in package.json.
const traverse = babelTraverse as any as typeof babelTraverse.default;
// TODO: Remove when @types/babel__generate has type=module in package.json.
const generate = babelGenerate as any as typeof babelGenerate.default;

export default <LoaderDefinitionFunction>(
  function webpackRscServerLoader(source, sourceMap) {
    this.cacheable(true);

    const ast = parse(source, {
      sourceType: `module`,
      sourceFilename: this.resourcePath,
    });

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
          path.replaceWith(createExportedClientReference(exportName));
          path.skip();
        } else {
          path.remove();
        }
      },
    });

    const {code, map} = generate(ast, {
      sourceMaps: true,
      sourceFileName: this.resourcePath,
    });

    (async () => {
      if (sourceMap && map) {
        const sourceMapGenerator = SourceMapGenerator.fromSourceMap(
          await new SourceMapConsumer(map),
        );

        sourceMapGenerator.applySourceMap(
          await new SourceMapConsumer(sourceMap as RawSourceMap | string),
        );

        this.callback(null, code, sourceMapGenerator.toJSON());
      } else {
        this.callback(null, code, map ?? undefined);
      }
    })().catch((error) => {
      this.callback(error);
    });
  }
);

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
  exportName: string,
): t.ExportNamedDeclaration {
  return t.exportNamedDeclaration(
    t.variableDeclaration(`const`, [
      t.variableDeclarator(
        t.identifier(exportName),
        t.objectExpression([
          t.objectProperty(
            t.identifier(`$$type`),
            createReferenceSymbol(`client`),
          ),
          t.objectProperty(
            t.identifier(`$$id`),
            createIdPlaceholderValue(exportName),
          ),
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

function createIdPlaceholderValue(exportName: string): t.CallExpression {
  // Using `eval` to trick webpack into not concatenating the module. This is
  // just a placeholder, and will be replaced by the accompanying plugin.
  return t.callExpression(t.identifier(`eval`), [
    t.stringLiteral(`'${exportName}'`),
  ]);
}
