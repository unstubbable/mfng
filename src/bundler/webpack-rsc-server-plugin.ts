import type Webpack from 'webpack';
import {isUseClientDirective, isUseServerDirective} from './node-helpers.js';

export interface WebpackRscServerPluginOptions {}

export interface ModuleExportsInfo {
  readonly moduleResource: string;
  readonly exportName: string;
}

export class WebpackRscServerPlugin {
  private serverModuleNames: Set<string> = new Set();

  constructor(_options: WebpackRscServerPluginOptions) {}

  apply(compiler: Webpack.Compiler): void {
    const {
      Template,
      dependencies: {ModuleDependency},
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

        const exportNames = [
          ...moduleGraph.getExportsInfo(module).orderedExports,
        ].map(({name}) => name);

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
            const isClientModule = program.body.some(isUseClientDirective);
            const isServerModule = program.body.some(isUseServerDirective);
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
      },
    );
  }
}
