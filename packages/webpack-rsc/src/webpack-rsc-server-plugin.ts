import type {Directive, ModuleDeclaration, Statement} from 'estree';
import type Webpack from 'webpack';
import type {ClientReferencesMap} from './webpack-rsc-server-loader.cjs';

export interface WebpackRscServerPluginOptions {
  readonly clientReferencesMap: ClientReferencesMap;
  readonly serverManifestFilename?: string;
}

export interface ModuleExportsInfo {
  readonly moduleResource: string;
  readonly exportName: string;
}

export const webpackRscLayerName = `react-server`;

export class WebpackRscServerPlugin {
  private clientReferencesMap: ClientReferencesMap;
  private serverManifest: Record<string | number, string[]> = {};
  private serverManifestFilename: string;
  private serverModuleResources = new Set<string>();
  private clientModuleResources = new Set<string>();

  constructor(options: WebpackRscServerPluginOptions) {
    this.clientReferencesMap = options.clientReferencesMap;

    this.serverManifestFilename =
      options?.serverManifestFilename || `react-server-manifest.json`;
  }

  apply(compiler: Webpack.Compiler): void {
    const {
      EntryPlugin,
      Template,
      WebpackError,
      dependencies: {ModuleDependency},
      util: {
        runtime: {getEntryRuntime},
      },
      sources: {RawSource},
    } = compiler.webpack;

    class ServerReferenceDependency extends ModuleDependency {
      constructor(request: string) {
        super(request);
      }

      override get type(): string {
        return `server-reference`;
      }
    }

    class ServerReferenceTemplate extends Template {
      apply(
        dependency: ServerReferenceDependency,
        source: Webpack.sources.ReplaceSource,
        {
          chunkGraph,
          moduleGraph,
        }: {
          chunkGraph: Webpack.ChunkGraph;
          moduleGraph: Webpack.ModuleGraph;
        },
      ): void {
        const module = moduleGraph.getModule(dependency);
        const id = chunkGraph.getModuleId(module);
        const exportNames = getExportNames(moduleGraph, module);

        const newSource = exportNames
          .map((exportName) =>
            Template.asString([
              ``,
              `Object.defineProperties(${exportName}, {`,
              Template.indent([
                `$$typeof: {value: Symbol.for("react.server.reference")},`,
                `$$id: {value: ${JSON.stringify(id + `#` + exportName)}},`,
              ]),
              `});`,
            ]),
          )
          .join(`\n`);

        source.insert(source.size(), newSource);
      }
    }

    const addClientModuleInclude = async (
      compilation: Webpack.Compilation,
      resource: string,
    ) => {
      const [entryName, ...otherEntryNames] = compilation.entries.keys();

      if (!entryName) {
        compilation.errors.push(
          new WebpackError(`Could not find an entry in the compilation.`),
        );

        return;
      }

      if (otherEntryNames.length > 0) {
        compilation.warnings.push(
          new WebpackError(
            `Found multiple entries in the compilation, adding client module include (for SSR) only to the first entry.`,
          ),
        );
      }

      const dependency = EntryPlugin.createDependency(resource, {
        name: resource,
      });

      const entryOptions: Webpack.EntryOptions = {name: entryName};

      return new Promise<void>((resolve, reject) => {
        compilation.addInclude(
          compiler.context,
          dependency,
          entryOptions,
          (error, module) => {
            if (error) {
              return reject(error);
            }

            const exportsInfo = compilation.moduleGraph.getExportsInfo(module!);

            exportsInfo.setUsedInUnknownWay(
              getEntryRuntime(compilation, entryName, entryOptions),
            );

            resolve();
          },
        );
      });
    };

    compiler.hooks.finishMake.tapPromise(
      WebpackRscServerPlugin.name,
      async (compilation) => {
        await Promise.all(
          Array.from(this.clientModuleResources).map(async (resource) =>
            addClientModuleInclude(compilation, resource),
          ),
        );
      },
    );

    compiler.hooks.thisCompilation.tap(
      WebpackRscServerPlugin.name,
      (compilation, {normalModuleFactory}) => {
        compilation.dependencyFactories.set(
          ServerReferenceDependency,
          normalModuleFactory,
        );

        compilation.dependencyTemplates.set(
          ServerReferenceDependency,
          new ServerReferenceTemplate(),
        );

        const onNormalModuleFactoryParser = (
          parser: Webpack.javascript.JavascriptParser,
        ) => {
          parser.hooks.program.tap(WebpackRscServerPlugin.name, (program) => {
            const isClientModule = program.body.some(isDirective(`use client`));
            const isServerModule = program.body.some(isDirective(`use server`));
            const {module} = parser.state;
            const {resource} = module;

            if (isServerModule && isClientModule) {
              compilation.errors.push(
                new WebpackError(
                  `Cannot use both 'use server' and 'use client' in the same module ${resource}.`,
                ),
              );

              return;
            }

            if (isClientModule) {
              this.clientModuleResources.add(resource);
            }

            if (isServerModule && !this.serverModuleResources.has(resource)) {
              this.serverModuleResources.add(resource);
              module.addDependency(new ServerReferenceDependency(resource));
            }
          });
        };

        normalModuleFactory.hooks.parser
          .for(`javascript/auto`)
          .tap(`HarmonyModulesPlugin`, onNormalModuleFactoryParser);

        normalModuleFactory.hooks.parser
          .for(`javascript/dynamic`)
          .tap(`HarmonyModulesPlugin`, onNormalModuleFactoryParser);

        normalModuleFactory.hooks.parser
          .for(`javascript/esm`)
          .tap(`HarmonyModulesPlugin`, onNormalModuleFactoryParser);

        compilation.hooks.afterOptimizeModuleIds.tap(
          WebpackRscServerPlugin.name,
          (modules) => {
            for (const module of modules) {
              const resource = module.nameForCondition();

              if (!resource) {
                continue;
              }

              const moduleId = compilation.chunkGraph.getModuleId(module);

              if (
                module.layer !== webpackRscLayerName &&
                this.clientModuleResources.has(resource)
              ) {
                const clientReferences = this.clientReferencesMap.get(resource);

                if (clientReferences) {
                  for (const clientReference of clientReferences) {
                    clientReference.ssrId = moduleId;
                  }
                }
              } else if (this.serverModuleResources.has(resource)) {
                this.serverManifest[moduleId] = getExportNames(
                  compilation.moduleGraph,
                  module,
                );
              }
            }
          },
        );

        compilation.hooks.processAssets.tap(WebpackRscServerPlugin.name, () => {
          compilation.emitAsset(
            this.serverManifestFilename,
            new RawSource(JSON.stringify(this.serverManifest, null, 2), false),
          );
        });
      },
    );
  }
}

function isDirective(
  value: string,
): (node: Directive | Statement | ModuleDeclaration) => node is Directive {
  return (node): node is Directive =>
    node.type === `ExpressionStatement` &&
    node.expression.type === `Literal` &&
    node.expression.value === value;
}

function getExportNames(
  moduleGraph: Webpack.ModuleGraph,
  module: Webpack.Module,
): string[] {
  return [...moduleGraph.getExportsInfo(module).orderedExports].map(
    ({name}) => name,
  );
}
