import type Webpack from 'webpack';
import {
  ClientReferenceDependency,
  ClientReferenceTemplate,
  isClientReferenceDependency,
} from './client-reference.js';
import {getExportNames} from './get-export-names.js';
import {isUseClientDirective, isUseServerDirective} from './node-helpers.js';
import {
  ServerReferenceDependency,
  ServerReferenceTemplate,
} from './server-reference.js';

export interface WebpackRscServerPluginOptions {
  readonly clientModulesCache: Map<string, ModuleExportsInfo>;
  readonly serverModulesCache: Map<string, ModuleExportsInfo>;
}

export interface ModuleExportsInfo {
  readonly id: string | number;
  readonly exportNames: Map<string, string>;
}

export class WebpackRscServerPlugin {
  private clientModulesCache: Map<string, ModuleExportsInfo>;
  private serverModulesCache: Map<string, ModuleExportsInfo>;

  constructor(options: WebpackRscServerPluginOptions) {
    this.clientModulesCache = options.clientModulesCache;
    this.serverModulesCache = options.serverModulesCache;
  }

  apply(compiler: Webpack.Compiler): void {
    compiler.hooks.thisCompilation.tap(
      WebpackRscServerPlugin.name,
      (compilation, {normalModuleFactory}) => {
        compilation.dependencyTemplates.set(
          ClientReferenceDependency,
          new ClientReferenceTemplate(),
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

            if (isServerModule && isClientModule) {
              throw new Error(
                `Cannot use both 'use server' and 'use client' in the same module ${parser.state.module.resource}.`,
              );
            }

            if (isClientModule) {
              parser.state.module.addDependency(
                new ClientReferenceDependency(parser.state.module),
              );
            }

            if (isServerModule) {
              parser.state.module.addDependency(
                new ServerReferenceDependency(parser.state.module),
              );
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

        compilation.hooks.chunkAsset.tap(
          WebpackRscServerPlugin.name,
          (chunk) => {
            const modules = compilation.chunkGraph.getChunkModules(chunk);

            for (const module of modules) {
              const clientReferenceDependency = module.dependencies.find(
                isClientReferenceDependency,
              );

              if (clientReferenceDependency) {
                this.clientModulesCache.set(
                  clientReferenceDependency.normalModule.resource,
                  {
                    id: compilation.chunkGraph.getModuleId(module),
                    exportNames: getExportNames(
                      module,
                      compilation.moduleGraph,
                      chunk.runtime,
                    ),
                  },
                );
              }
            }
          },
        );
      },
    );
  }
}
