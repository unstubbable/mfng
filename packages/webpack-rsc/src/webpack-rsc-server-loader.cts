import path = require('path');
import generate = require('@babel/generator');
import parser = require('@babel/parser');
import traverse = require('@babel/traverse');
import t = require('@babel/types');
import webpack = require('webpack');

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

type RegisterReferenceType = 'Server' | 'Client';

const webpackRscServerLoader: webpack.LoaderDefinitionFunction<webpackRscServerLoader.WebpackRscServerLoaderOptions> =
  function (source, sourceMap) {
    this.cacheable(true);

    const {clientReferencesMap} = this.getOptions();
    const clientReferences: webpackRscServerLoader.ClientReference[] = [];
    const resourcePath = this.resourcePath;

    const ast = parser.parse(source, {
      sourceType: `module`,
      sourceFilename: resourcePath,
    });

    let moduleDirective: 'use client' | 'use server' | undefined;
    let addedRegisterReferenceCall: RegisterReferenceType | undefined;
    const unshiftedNodes = new Set<t.Node>();

    traverse.default(ast, {
      enter(nodePath) {
        const {node} = nodePath;

        if (t.isProgram(node)) {
          if (node.directives.some(isDirective(`use client`))) {
            moduleDirective = `use client`;
          } else if (node.directives.some(isDirective(`use server`))) {
            moduleDirective = `use server`;
          } else {
            nodePath.skip();
          }

          return;
        }

        if (
          !moduleDirective ||
          (t.isDirective(node) && isDirective(`use client`)(node)) ||
          unshiftedNodes.has(node)
        ) {
          nodePath.skip();

          return;
        }

        const exportName = getExportName(node);

        if (moduleDirective === `use client`) {
          if (exportName) {
            const id = `${path.relative(process.cwd(), resourcePath)}`;
            clientReferences.push({id, exportName});
            addedRegisterReferenceCall = `Client`;
            nodePath.replaceWith(createExportedClientReference(id, exportName));
            nodePath.skip();
          } else {
            nodePath.remove();
          }
        } else if (exportName) {
          addedRegisterReferenceCall = `Server`;
          nodePath.insertAfter(createRegisterServerReference(exportName));
          nodePath.skip();
        }
      },
      exit(nodePath) {
        if (!t.isProgram(nodePath.node) || !addedRegisterReferenceCall) {
          nodePath.skip();

          return;
        }

        const nodes: t.Node[] = [
          createRegisterReferenceImport(addedRegisterReferenceCall),
        ];

        if (addedRegisterReferenceCall === `Client`) {
          nodes.push(createClientReferenceProxyImplementation());
        }

        for (const node of nodes) {
          unshiftedNodes.add(node);
        }

        (nodePath as traverse.NodePath<t.Program>).unshiftContainer(
          `body`,
          nodes,
        );
      },
    });

    if (!moduleDirective) {
      return this.callback(null, source, sourceMap);
    }

    if (clientReferences.length > 0) {
      clientReferencesMap.set(resourcePath, clientReferences);
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

function isDirective(
  value: 'use client' | 'use server',
): (directive: t.Directive) => boolean {
  return (directive) =>
    t.isDirectiveLiteral(directive.value) && directive.value.value === value;
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
        t.callExpression(t.identifier(`registerClientReference`), [
          t.callExpression(t.identifier(`createClientReferenceProxy`), [
            t.stringLiteral(exportName),
          ]),
          t.stringLiteral(id),
          t.stringLiteral(exportName),
        ]),
      ),
    ]),
  );
}

function createClientReferenceProxyImplementation(): t.FunctionDeclaration {
  return t.functionDeclaration(
    t.identifier(`createClientReferenceProxy`),
    [t.identifier(`exportName`)],
    t.blockStatement([
      t.returnStatement(
        t.arrowFunctionExpression(
          [],
          t.blockStatement([
            t.throwStatement(
              t.newExpression(t.identifier(`Error`), [
                t.templateLiteral(
                  [
                    t.templateElement({raw: `Attempted to call `}),
                    t.templateElement({raw: `() from the server but `}),
                    t.templateElement(
                      {
                        raw: ` is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.`,
                      },
                      true,
                    ),
                  ],
                  [t.identifier(`exportName`), t.identifier(`exportName`)],
                ),
              ]),
            ),
          ]),
        ),
      ),
    ]),
  );
}

function createRegisterServerReference(exportName: string): t.CallExpression {
  return t.callExpression(t.identifier(`registerServerReference`), [
    t.identifier(exportName),
    t.identifier(webpack.RuntimeGlobals.moduleId),
    t.stringLiteral(exportName),
  ]);
}

function createRegisterReferenceImport(
  type: RegisterReferenceType,
): t.ImportDeclaration {
  return t.importDeclaration(
    [
      t.importSpecifier(
        t.identifier(`register${type}Reference`),
        t.identifier(`register${type}Reference`),
      ),
    ],
    t.stringLiteral(`react-server-dom-webpack/server`),
  );
}

export = webpackRscServerLoader;
