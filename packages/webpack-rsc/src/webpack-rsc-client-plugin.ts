import {createRequire} from 'module';
import type {
  ClientManifest,
  ClientReferenceMetadata,
  SSRManifest,
} from 'react-server-dom-webpack';
import type Webpack from 'webpack';
import type {ClientReferencesMap} from './webpack-rsc-server-loader.cjs';

export interface WebpackRscClientPluginOptions {
  readonly clientReferencesMap: ClientReferencesMap;
  readonly clientManifestFilename?: string;
  readonly ssrManifestFilename?: string;
}

const require = createRequire(import.meta.url);

export class WebpackRscClientPlugin {
  private clientReferencesMap: ClientReferencesMap;
  private clientChunkNameMap = new Map<string, string>();
  private clientManifest: ClientManifest = {};
  private clientManifestFilename: string;
  private ssrManifest: SSRManifest = {moduleMap: {}, moduleLoading: null};
  private ssrManifestFilename: string;

  constructor(options: WebpackRscClientPluginOptions) {
    this.clientReferencesMap = options.clientReferencesMap;

    this.clientManifestFilename =
      options.clientManifestFilename || `react-client-manifest.json`;

    this.ssrManifestFilename =
      options?.ssrManifestFilename || `react-ssr-manifest.json`;
  }

  apply(compiler: Webpack.Compiler): void {
    const {
      AsyncDependenciesBlock,
      RuntimeGlobals,
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
      WebpackRscClientPlugin.name,
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
          `react-server-dom-webpack/client.browser`,
        );

        const onNormalModuleFactoryParser = (
          parser: Webpack.javascript.JavascriptParser,
        ) => {
          compilation.assetsInfo;
          parser.hooks.program.tap(WebpackRscClientPlugin.name, () => {
            if (parser.state.module.resource === reactServerDomClientPath) {
              [...this.clientReferencesMap.keys()].forEach(
                (resourcePath, index) => {
                  const chunkName = `client${index}`;
                  this.clientChunkNameMap.set(chunkName, resourcePath);

                  const block = new AsyncDependenciesBlock(
                    {name: chunkName},
                    undefined,
                    resourcePath,
                  );

                  block.addDependency(
                    new ClientReferenceDependency(resourcePath),
                  );

                  parser.state.module.addBlock(block);
                },
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

        compilation.hooks.additionalTreeRuntimeRequirements.tap(
          WebpackRscClientPlugin.name,
          (_chunk, runtimeRequirements) => {
            runtimeRequirements.add(RuntimeGlobals.ensureChunk);
            runtimeRequirements.add(RuntimeGlobals.compatGetDefaultExport);
          },
        );

        compilation.hooks.chunkAsset.tap(
          WebpackRscClientPlugin.name,
          (chunk) => {
            const resourcePath = this.clientChunkNameMap.get(chunk.name);

            if (resourcePath) {
              const clientReferences =
                this.clientReferencesMap.get(resourcePath);

              if (clientReferences) {
                const module = compilation.chunkGraph
                  .getChunkModules(chunk)
                  .find(
                    (chunkModule) =>
                      chunkModule.nameForCondition() === resourcePath,
                  );

                if (module) {
                  const moduleId = compilation.chunkGraph.getModuleId(module);

                  const ssrModuleMetaData: Record<
                    string,
                    ClientReferenceMetadata
                  > = {};

                  for (const {id, exportName, ssrId} of clientReferences) {
                    // Theoretically the used client and SSR export names should
                    // be used here. These might differ from the original export
                    // names that the loader has recorded. But with the current
                    // setup (i.e. how the client entries are added on both
                    // sides), the original export names are preserved.
                    const clientExportName = exportName;
                    const ssrExportName = exportName;

                    // chunks is a double indexed array of chunkId / chunkFilename pairs
                    const chunks: (string | number)[] = [];

                    if (chunk.id) {
                      for (const file of chunk.files) {
                        chunks.push(chunk.id, file);
                      }
                    }

                    this.clientManifest[id] = {
                      id: moduleId,
                      name: clientExportName,
                      chunks,
                    };

                    if (ssrId) {
                      ssrModuleMetaData[clientExportName] = {
                        id: ssrId,
                        name: ssrExportName,
                        chunks: [],
                      };
                    }
                  }

                  this.ssrManifest.moduleMap[moduleId] = ssrModuleMetaData;
                }
              }
            }
          },
        );

        compilation.hooks.processAssets.tap(WebpackRscClientPlugin.name, () => {
          compilation.emitAsset(
            this.clientManifestFilename,
            new RawSource(JSON.stringify(this.clientManifest, null, 2), false),
          );

          const {crossOriginLoading, publicPath = ``} =
            compilation.outputOptions;

          this.ssrManifest.moduleLoading = {
            // https://github.com/webpack/webpack/blob/87660921808566ef3b8796f8df61bd79fc026108/lib/runtime/PublicPathRuntimeModule.js#L30-L32
            prefix: compilation.getPath(publicPath, {
              hash: compilation.hash ?? `XXXX`,
            }),
            crossOrigin: crossOriginLoading
              ? crossOriginLoading === `use-credentials`
                ? crossOriginLoading
                : ``
              : undefined,
          };

          compilation.emitAsset(
            this.ssrManifestFilename,
            new RawSource(JSON.stringify(this.ssrManifest, null, 2), false),
          );
        });
      },
    );
  }
}
