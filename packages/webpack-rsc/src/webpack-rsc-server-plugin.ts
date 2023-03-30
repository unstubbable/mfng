import type {Directive, ModuleDeclaration, Statement} from 'estree';
import type Webpack from 'webpack';

export interface WebpackRscServerPluginOptions {
  readonly serverManifestFilename?: string;
}

export interface ModuleExportsInfo {
  readonly moduleResource: string;
  readonly exportName: string;
}

export class WebpackRscServerPlugin {
  private serverManifestFilename: string;
  private serverModuleNames = new Set<string>();
  private serverManifest: Record<string | number, string[]> = {};

  constructor(options?: WebpackRscServerPluginOptions) {
    this.serverManifestFilename =
      options?.serverManifestFilename || `react-server-manifest.json`;
  }

  apply(compiler: Webpack.Compiler): void {
    const {
      Template,
      dependencies: {ModuleDependency},
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

        const onNormalModuleFactoryParser = (
          parser: Webpack.javascript.JavascriptParser,
        ) => {
          parser.hooks.program.tap(WebpackRscServerPlugin.name, (program) => {
            const isClientModule = program.body.some(isDirective(`use client`));
            const isServerModule = program.body.some(isDirective(`use server`));
            const {module} = parser.state;

            if (isServerModule && isClientModule) {
              throw new Error(
                `Cannot use both 'use server' and 'use client' in the same module ${module.resource}.`,
              );
            }

            if (isServerModule) {
              const moduleName = module.nameForCondition();

              if (!moduleName) {
                throw new Error(
                  `Server module ${module.resource} did not return a value for "nameForCondition".`,
                );
              }

              if (!this.serverModuleNames.has(moduleName)) {
                this.serverModuleNames.add(moduleName);

                module.addDependency(new ServerReferenceDependency(moduleName));
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
              const moduleName = module.nameForCondition();

              if (!moduleName || !this.serverModuleNames.has(moduleName)) {
                continue;
              }

              const id = compilation.chunkGraph.getModuleId(module);

              this.serverManifest[id] = getExportNames(
                compilation.moduleGraph,
                module,
              );
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
