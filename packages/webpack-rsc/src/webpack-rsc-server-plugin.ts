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
  private clientModuleResouces = new Set<string>();

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

        const addClientEntry = (resource: string) => {
          const [entry, ...otherEntries] = compilation.entries.values();

          if (!entry) {
            compilation.errors.push(
              new WebpackError(`Could not find an entry in the compilation.`),
            );

            return;
          }

          if (otherEntries.length > 0) {
            compilation.warnings.push(
              new WebpackError(
                `Found multiple entries in the compilation, adding client module entry dependencies (for SSR) only to the first entry.`,
              ),
            );
          }

          const dependency = EntryPlugin.createDependency(resource, {
            name: resource,
          });

          entry.includeDependencies.push(dependency);

          const entryName = entry.options.name;

          if (!entryName) {
            compilation.errors.push(
              new WebpackError(`The entry must have a name.`),
            );

            return;
          }

          const entryOptions: Webpack.EntryOptions = {name: entryName};

          compilation.hooks.addEntry.call(dependency, entryOptions);

          compilation.addModuleTree(
            {context: compiler.context, dependency},
            (error, entryModule) => {
              if (error) {
                compilation.hooks.failedEntry.call(
                  dependency,
                  entryOptions,
                  error,
                );
              } else {
                this.clientModuleResouces.add(resource);

                const exportsInfo = compilation.moduleGraph.getExportsInfo(
                  entryModule!,
                );

                exportsInfo.setUsedInUnknownWay(
                  getEntryRuntime(compilation, entryName, entryOptions),
                );

                compilation.hooks.succeedEntry.call(
                  dependency,
                  entryOptions,
                  entryModule!,
                );
              }
            },
          );
        };

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
              addClientEntry(resource);
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
                this.clientModuleResouces.has(resource)
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
