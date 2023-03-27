import {createRequire} from 'module';
import type {SSRManifest} from 'react-server-dom-webpack';
import type Webpack from 'webpack';
import type {ClientReferencesForSsrMap} from './webpack-rsc-client-plugin.js';

export interface WebpackRscSsrPluginOptions {
  readonly clientReferencesForSsrMap: ClientReferencesForSsrMap;
  readonly ssrManifestFilename?: string;
}

const require = createRequire(import.meta.url);

export class WebpackRscSsrPlugin {
  private clientReferencesForSsrMap: ClientReferencesForSsrMap;
  private ssrManifest: SSRManifest = {};
  private ssrManifestFilename: string;

  constructor(options: WebpackRscSsrPluginOptions) {
    this.clientReferencesForSsrMap = options.clientReferencesForSsrMap;

    this.ssrManifestFilename =
      options.ssrManifestFilename || `react-ssr-manifest.json`;
  }

  apply(compiler: Webpack.Compiler): void {
    const {
      AsyncDependenciesBlock,
      dependencies: {ModuleDependency, NullDependency},
      sources: {RawSource},
    } = compiler.webpack;

    class ClientReferenceDependency extends ModuleDependency {
      constructor(request: string) {
        super(request);
      }

      override get type(): string {
        return `client-reference`;
      }
    }

    compiler.hooks.thisCompilation.tap(
      WebpackRscSsrPlugin.name,
      (compilation, {normalModuleFactory}) => {
        compilation.dependencyFactories.set(
          ClientReferenceDependency,
          normalModuleFactory,
        );

        compilation.dependencyTemplates.set(
          ClientReferenceDependency,
          new NullDependency.Template(),
        );

        const reactServerDomClientPath = require.resolve(
          `react-server-dom-webpack/client.edge`,
        );

        const onNormalModuleFactoryParser = (
          parser: Webpack.javascript.JavascriptParser,
        ) => {
          parser.hooks.program.tap(WebpackRscSsrPlugin.name, () => {
            if (
              parser.state.module.nameForCondition() ===
              reactServerDomClientPath
            ) {
              for (const resourcePath of this.clientReferencesForSsrMap.keys()) {
                const block = new AsyncDependenciesBlock(
                  {name: resourcePath},
                  undefined,
                  resourcePath,
                );

                block.addDependency(
                  new ClientReferenceDependency(resourcePath),
                );

                parser.state.module.addBlock(block);
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
          WebpackRscSsrPlugin.name,
          (modules) => {
            for (const module of modules) {
              const resourcePath = module.nameForCondition();

              if (!resourcePath) {
                continue;
              }

              const clientReference =
                this.clientReferencesForSsrMap.get(resourcePath);

              if (!clientReference) {
                continue;
              }

              const id = compilation.chunkGraph.getModuleId(module);
              const {clientId, exportNames} = clientReference;

              this.ssrManifest[clientId] = Object.fromEntries(
                exportNames.map((exportName) => [
                  exportName,
                  {id, name: exportName, chunks: []},
                ]),
              );
            }
          },
        );

        compilation.hooks.processAssets.tap(WebpackRscSsrPlugin.name, () => {
          compilation.emitAsset(
            this.ssrManifestFilename,
            new RawSource(JSON.stringify(this.ssrManifest, null, 2), false),
          );
        });
      },
    );
  }
}
