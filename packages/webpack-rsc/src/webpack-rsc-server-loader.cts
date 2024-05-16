import path = require('path');
import generate = require('@babel/generator');
import parser = require('@babel/parser');
import traverse = require('@babel/traverse');
import t = require('@babel/types');
import webpack = require('webpack');

namespace webpackRscServerLoader {
  export interface WebpackRscServerLoaderOptions {
    readonly clientReferencesMap: ClientReferencesMap;
    readonly serverReferencesMap: ServerReferencesMap;
  }

  export type ClientReferencesMap = Map<string, ClientReference[]>;

  export interface ClientReference {
    readonly id: string;
    readonly exportName: string;
    ssrId?: string | number;
  }

  export type ServerReferencesMap = Map<string, ServerReferencesModuleInfo>;

  export interface ServerReferencesModuleInfo {
    readonly exportNames: string[];
    moduleId?: string | number;
  }
}

type RegisterReferenceType = 'Server' | 'Client';

interface FunctionInfo {
  readonly localName: string;
  readonly hasUseServerDirective: boolean;
}

interface ExtendedFunctionInfo extends FunctionInfo {
  readonly exportName?: string;
}

// TODO: Refactor to better separate logic for server and client modules.
const webpackRscServerLoader: webpack.LoaderDefinitionFunction<webpackRscServerLoader.WebpackRscServerLoaderOptions> =
  function (source, sourceMap) {
    this.cacheable(true);

    const {clientReferencesMap, serverReferencesMap} = this.getOptions();
    const clientReferences: webpackRscServerLoader.ClientReference[] = [];
    const serverReferenceExportNames: string[] = [];
    const resourcePath = this.resourcePath;

    const ast = parser.parse(source, {
      sourceType: `module`,
      sourceFilename: resourcePath,
      plugins: [`importAssertions`],
    });

    let moduleDirective: 'use client' | 'use server' | undefined;
    let addedRegisterReferenceCall: RegisterReferenceType | undefined;
    const unshiftedNodes = new Set<t.Node>();
    const exportNames = new Set<string>();
    const exportNamesByLocalName = new Map<string, string>();

    const localTopLevelFunctionsByNode = new WeakMap<
      traverse.Node,
      FunctionInfo
    >();

    traverse.default(ast, {
      enter(nodePath) {
        const {node} = nodePath;

        if (
          !t.isProgram(node) &&
          !t.isProgram(nodePath.parent) &&
          !t.isExportNamedDeclaration(nodePath.parent)
        ) {
          return nodePath.skip();
        }

        if (t.isExportNamedDeclaration(node)) {
          for (const exportName of Object.keys(
            // TODO: This is potentially to broad.
            t.getBindingIdentifiers(node, false, true),
          )) {
            exportNames.add(exportName);
          }

          for (const exportSpecifier of node.specifiers) {
            if (
              t.isExportSpecifier(exportSpecifier) &&
              t.isIdentifier(exportSpecifier.exported)
            ) {
              const {
                exported: {name: exportName},
                local: {name: localName},
              } = exportSpecifier;

              exportNames.add(exportName);
              exportNamesByLocalName.set(localName, exportName);
            }
          }
        }

        const functionInfo = getFunctionInfo(node);

        if (functionInfo) {
          localTopLevelFunctionsByNode.set(node, functionInfo);
        }
      },
    });

    traverse.default(ast, {
      enter(nodePath) {
        const {node} = nodePath;

        if (t.isProgram(node)) {
          if (node.directives.some(isDirective(`use client`))) {
            moduleDirective = `use client`;
          } else if (node.directives.some(isDirective(`use server`))) {
            moduleDirective = `use server`;
          }

          return;
        }

        if (
          (t.isDirective(node) && isDirective(`use client`)(node)) ||
          unshiftedNodes.has(node)
        ) {
          return nodePath.skip();
        }

        if (moduleDirective === `use client`) {
          if (t.isExportDefaultDeclaration(node)) {
            const exportName = ``;

            const id = `${path.relative(
              process.cwd(),
              resourcePath,
            )}#${exportName}`;

            clientReferences.push({id, exportName});
            addedRegisterReferenceCall = `Client`;

            nodePath.replaceWith(
              createDefaultExportedClientReference(id, resourcePath),
            );

            return nodePath.skip();
          }

          return nodePath.remove();
        }

        const extendedFunctionInfo = getExtendedFunctionInfo(
          node,
          localTopLevelFunctionsByNode,
          exportNamesByLocalName,
        );

        if (extendedFunctionInfo) {
          const {localName, exportName, hasUseServerDirective} =
            extendedFunctionInfo;

          if (
            (moduleDirective === `use server` && exportName) ||
            hasUseServerDirective
          ) {
            if (hasUseServerDirective && !exportName) {
              nodePath.insertAfter(createExportNamedDeclaration(localName));
            }

            nodePath.insertAfter(
              createRegisterServerReference(extendedFunctionInfo),
            );

            serverReferenceExportNames.push(exportName ?? localName);
            addedRegisterReferenceCall = `Server`;
          }

          nodePath.skip();
        }
      },
      exit(nodePath) {
        if (!t.isProgram(nodePath.node)) {
          nodePath.skip();

          return;
        }

        const nodes: t.Node[] = [];

        if (moduleDirective === `use client` && exportNames.size > 0) {
          nodes.unshift(createClientReferenceProxyImplementation());

          for (const exportName of exportNames) {
            const id = `${path.relative(
              process.cwd(),
              resourcePath,
            )}#${exportName}`;

            clientReferences.push({id, exportName});
            addedRegisterReferenceCall = `Client`;
            nodes.push(createNamedExportedClientReference(id, exportName));
          }
        }

        if (!addedRegisterReferenceCall) {
          nodePath.skip();

          return;
        }

        nodes.unshift(
          createRegisterReferenceImport(addedRegisterReferenceCall),
        );

        for (const node of nodes) {
          unshiftedNodes.add(node);
        }

        (nodePath as traverse.NodePath<t.Program>).unshiftContainer(
          `body`,
          nodes,
        );
      },
    });

    if (!addedRegisterReferenceCall) {
      return this.callback(null, source, sourceMap);
    }

    if (clientReferences.length > 0) {
      clientReferencesMap.set(resourcePath, clientReferences);
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

function isDirective(
  value: 'use client' | 'use server',
): (directive: t.Directive) => boolean {
  return (directive) =>
    t.isDirectiveLiteral(directive.value) && directive.value.value === value;
}

function getExtendedFunctionInfo(
  node: t.Node,
  localTopLevelFunctionsByNode: WeakMap<traverse.Node, FunctionInfo>,
  exportNamesByLocalName: Map<string, string>,
): ExtendedFunctionInfo | undefined {
  if (t.isExportNamedDeclaration(node) && node.declaration) {
    const functionInfo = localTopLevelFunctionsByNode.get(node.declaration);

    if (functionInfo) {
      return {
        localName: functionInfo.localName,
        exportName: functionInfo.localName,
        hasUseServerDirective: functionInfo.hasUseServerDirective,
      };
    }
  } else {
    const functionInfo = localTopLevelFunctionsByNode.get(node);

    if (functionInfo) {
      const exportName = exportNamesByLocalName.get(functionInfo.localName);

      return {
        localName: functionInfo.localName,
        exportName,
        hasUseServerDirective: functionInfo.hasUseServerDirective,
      };
    }
  }

  return undefined;
}

function getFunctionInfo(node: t.Node): FunctionInfo | undefined {
  let localName: string | undefined;
  let hasUseServerDirective = false;

  if (t.isFunctionDeclaration(node)) {
    localName = node.id?.name;

    hasUseServerDirective = node.body.directives.some(
      isDirective(`use server`),
    );
  } else if (t.isVariableDeclaration(node)) {
    const [variableDeclarator] = node.declarations;

    if (variableDeclarator) {
      const {id, init} = variableDeclarator;

      if (
        t.isIdentifier(id) &&
        (t.isArrowFunctionExpression(init) || t.isFunctionExpression(init))
      ) {
        localName = id.name;

        if (t.isBlockStatement(init.body)) {
          hasUseServerDirective = init.body.directives.some(
            isDirective(`use server`),
          );
        }
      }
    }
  }

  return localName ? {localName, hasUseServerDirective} : undefined;
}

function createNamedExportedClientReference(
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

function createDefaultExportedClientReference(
  id: string,
  resourcePath: string,
): t.ExportNamedDeclaration | t.ExportDefaultDeclaration {
  return t.exportDefaultDeclaration(
    t.callExpression(t.identifier(`registerClientReference`), [
      t.arrowFunctionExpression(
        [],
        t.blockStatement([
          t.throwStatement(
            t.newExpression(t.identifier(`Error`), [
              t.stringLiteral(
                `Attempted to call the default export of ${resourcePath} from the server but it's on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.`,
              ),
            ]),
          ),
        ]),
      ),
      t.stringLiteral(id),
      t.stringLiteral(``),
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

function createRegisterServerReference(
  functionInfo: ExtendedFunctionInfo,
): t.ExpressionStatement {
  return t.expressionStatement(
    t.callExpression(t.identifier(`registerServerReference`), [
      t.identifier(functionInfo.localName),
      t.identifier(webpack.RuntimeGlobals.moduleId),
      t.stringLiteral(functionInfo.exportName ?? functionInfo.localName),
    ]),
  );
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

function createExportNamedDeclaration(
  localName: string,
): t.ExportNamedDeclaration {
  return t.exportNamedDeclaration(null, [
    t.exportSpecifier(t.identifier(localName), t.identifier(localName)),
  ]);
}

export = webpackRscServerLoader;
