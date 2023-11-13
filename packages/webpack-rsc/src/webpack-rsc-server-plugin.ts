import type {Directive, ModuleDeclaration, Statement} from 'estree';
import type Webpack from 'webpack';
import type {ServerReferencesMap} from './webpack-rsc-client-loader.cjs';
import type {ClientReferencesMap} from './webpack-rsc-server-loader.cjs';

export interface WebpackRscServerPluginOptions {
  readonly clientReferencesMap: ClientReferencesMap;
  readonly serverReferencesMap?: ServerReferencesMap;
  readonly serverManifestFilename?: string;
}

export interface ModuleExportsInfo {
  readonly moduleResource: string;
  readonly exportName: string;
}

export const webpackRscLayerName = `react-server`;

export class WebpackRscServerPlugin {
  private clientReferencesMap: ClientReferencesMap;
  private serverReferencesMap: ServerReferencesMap | undefined;
  private serverManifest: Record<string | number, string[]> = {};
  private serverManifestFilename: string;
  private clientModuleResources = new Set<string>();
  private serverModuleResources = new Set<string>();

  constructor(options: WebpackRscServerPluginOptions) {
    this.clientReferencesMap = options.clientReferencesMap;
    this.serverReferencesMap = options.serverReferencesMap;

    this.serverManifestFilename =
      options?.serverManifestFilename || `react-server-manifest.json`;
  }

  apply(compiler: Webpack.Compiler): void {
    const {
      EntryPlugin,
      WebpackError,
      dependencies: {NullDependency},
      util: {
        runtime: {getEntryRuntime},
      },
      sources: {RawSource},
    } = compiler.webpack;

    class ServerReferenceDependency extends NullDependency {
      override get type(): string {
        return `server-reference`;
      }
    }

    function hasServerReferenceDependency(module: Webpack.Module): boolean {
      return module.dependencies.some(
        (dependency) => dependency instanceof ServerReferenceDependency,
      );
    }

    const includeModule = async (
      compilation: Webpack.Compilation,
      resource: string,
      layer?: string,
    ) => {
      const [entry, ...otherEntries] = compilation.entries.entries();

      if (!entry) {
        compilation.errors.push(
          new WebpackError(`Could not find an entry in the compilation.`),
        );

        return;
      }

      if (otherEntries.length > 0) {
        compilation.warnings.push(
          new WebpackError(
            `Found multiple entries in the compilation, adding client module include (for SSR) only to the first entry.`,
          ),
        );
      }

      const [entryName] = entry;

      const dependency = EntryPlugin.createDependency(resource, {
        name: resource,
      });

      return new Promise<void>((resolve, reject) => {
        compilation.addInclude(
          compiler.context,
          dependency,
          {name: entryName, layer},
          (error, module) => {
            if (error) {
              return reject(error);
            }

            const exportsInfo = compilation.moduleGraph.getExportsInfo(module!);

            exportsInfo.setUsedInUnknownWay(
              getEntryRuntime(compilation, entryName, {name: entryName}),
            );

            resolve();
          },
        );
      });
    };

    compiler.hooks.finishMake.tapPromise(
      WebpackRscServerPlugin.name,
      async (compilation) => {
        await Promise.all([
          ...Array.from(this.clientModuleResources).map(async (resource) =>
            includeModule(compilation, resource),
          ),
          ...Array.from(this.serverModuleResources).map(async (resource) =>
            includeModule(compilation, resource, webpackRscLayerName),
          ),
        ]);
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
          new ServerReferenceDependency.Template(),
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

            if (isClientModule && module.layer === webpackRscLayerName) {
              this.clientModuleResources.add(resource);
              void includeModule(compilation, resource);
            }

            if (isServerModule && !hasServerReferenceDependency(module)) {
              this.serverModuleResources.add(resource);

              if (module.layer === webpackRscLayerName) {
                module.addDependency(new ServerReferenceDependency());
              }
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

              if (moduleId === null) {
                continue;
              }

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
              } else if (hasServerReferenceDependency(module)) {
                const exportNames = getExportNames(
                  compilation.moduleGraph,
                  module,
                );

                this.serverReferencesMap?.set(resource, {
                  moduleId,
                  exportNames,
                });

                this.serverManifest[moduleId] = exportNames;
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
