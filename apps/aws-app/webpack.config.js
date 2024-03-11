import {createRequire} from 'module';
import path from 'path';
import url from 'url';
import {
  WebpackRscClientPlugin,
  WebpackRscServerPlugin,
  createWebpackRscClientLoader,
  createWebpackRscServerLoader,
  createWebpackRscSsrLoader,
  webpackRscLayerName,
} from '@mfng/webpack-rsc';
import CopyPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ResolveTypeScriptPlugin from 'resolve-typescript-plugin';
import {WebpackManifestPlugin} from 'webpack-manifest-plugin';

const require = createRequire(import.meta.url);
const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));
const outputDirname = path.join(currentDirname, `dist`);
const outputHandlerDirname = path.join(outputDirname, `handler`);

const reactServerManifestFilename = path.join(
  outputHandlerDirname,
  `react-server-manifest.json`,
);

const reactClientManifestFilename = path.join(
  outputHandlerDirname,
  `react-client-manifest.json`,
);

const reactSsrManifestFilename = path.join(
  outputHandlerDirname,
  `react-ssr-manifest.json`,
);

const jsManifestFilename = path.join(outputHandlerDirname, `js-manifest.json`);

const cssManifestFilename = path.join(
  outputHandlerDirname,
  `css-manifest.json`,
);

/**
 * @param {unknown} _env
 * @param {{readonly mode?: import('webpack').Configuration['mode']}} argv
 * @return {import('webpack').Configuration[]}
 */
export default function createConfigs(_env, argv) {
  const {mode} = argv;
  const dev = mode === `development`;

  /**
   * @type {import('webpack').StatsOptions}
   */
  const stats = {
    assets: true,
    builtAt: true,
    chunks: false,
    colors: true,
    groupAssetsByEmitStatus: false,
    groupAssetsByExtension: true,
    groupAssetsByInfo: false,
    groupAssetsByPath: false,
    hash: false,
    modules: false,
    version: false,
  };

  const cssRule = {
    test: /\.css$/,
    use: [
      MiniCssExtractPlugin.loader,
      {
        loader: `css-loader`,
        options: {
          modules: {
            localIdentName: dev
              ? `[local]__[hash:base64:5]`
              : `[hash:base64:7]`,
            auto: true,
          },
        },
      },
      {
        loader: `postcss-loader`,
        options: {
          postcssOptions: {
            plugins: [
              `tailwindcss`,
              `autoprefixer`,
              ...(dev ? [] : [`cssnano`]),
            ],
          },
        },
      },
    ],
  };

  /**
   * @type {import('@mfng/webpack-rsc').ClientReferencesMap}
   */
  const clientReferencesMap = new Map();
  const serverReferencesMap = new Map();

  const rscServerLoader = createWebpackRscServerLoader({
    clientReferencesMap,
    serverReferencesMap,
  });

  const rscSsrLoader = createWebpackRscSsrLoader({serverReferencesMap});
  const rscClientLoader = createWebpackRscClientLoader({serverReferencesMap});

  /**
   * @type {import('webpack').RuleSetUseItem}
   */
  const serverSwcLoader = {
    loader: `swc-loader`,
    options: {env: {targets: {node: 18}}},
  };

  /**
   * @type {import('webpack').Configuration}
   */
  const serverConfig = {
    name: `server`,
    entry: `./src/handler/index.tsx`,
    target: `webworker`,
    output: {
      filename: `index.js`,
      path: outputHandlerDirname,
      libraryTarget: `module`,
      chunkFormat: `module`,
      devtoolModuleFilenameTemplate: (
        /** @type {{ absoluteResourcePath: string; }} */ info,
      ) => info.absoluteResourcePath,
    },
    resolve: {
      plugins: [new ResolveTypeScriptPlugin()],
      conditionNames: [
        `@mfng:internal:node`,
        `@mfng:internal`,
        `workerd`,
        `...`,
      ],
    },
    module: {
      rules: [
        {
          resource: [/rsc\.ts$/, /\/app\.tsx$/],
          layer: webpackRscLayerName,
        },
        {
          // AsyncLocalStorage module instances must be in a shared layer.
          layer: `shared`,
          test: /(router-location-async-local-storage|use-router-location)/,
        },
        {
          issuerLayer: webpackRscLayerName,
          resolve: {conditionNames: [`react-server`, `workerd`, `...`]},
        },
        {
          oneOf: [
            {
              issuerLayer: webpackRscLayerName,
              test: /\.tsx?$/,
              use: [rscServerLoader, serverSwcLoader],
            },
            {
              test: /\.tsx?$/,
              use: [rscSsrLoader, serverSwcLoader],
            },
          ],
        },
        cssRule,
      ],
    },
    plugins: [
      // server-main.css is not used, but required by MiniCssExtractPlugin.
      new MiniCssExtractPlugin({filename: `server-main.css`, runtime: false}),
      new WebpackRscServerPlugin({
        clientReferencesMap,
        serverReferencesMap,
        serverManifestFilename: path.relative(
          outputHandlerDirname,
          reactServerManifestFilename,
        ),
      }),
    ],
    experiments: {outputModule: true, layers: true, topLevelAwait: true},
    externals: [`node:async_hooks`],
    devtool: `source-map`,
    mode,
    stats,
  };

  const clientOutputDirname = path.join(outputDirname, `static/client`);

  /**
   * @type {import('webpack').Configuration}
   */
  const clientConfig = {
    name: `client`,
    dependencies: [`server`],
    entry: `./src/client.tsx`,
    output: {
      filename: dev ? `main.js` : `main.[contenthash:8].js`,
      path: clientOutputDirname,
      clean: !dev,
      publicPath: `/client/`,
    },
    resolve: {
      plugins: [new ResolveTypeScriptPlugin()],
      conditionNames: [`@mfng:internal`, `...`],
    },
    module: {
      rules: [
        {test: /\.js$/, loader: `source-map-loader`, enforce: `pre`},
        {
          test: /\.tsx?$/,
          use: [rscClientLoader, `swc-loader`],
          exclude: [/node_modules/],
        },
        cssRule,
      ],
    },
    plugins: [
      new CopyPlugin({
        patterns: [
          {
            from: path.join(
              path.dirname(require.resolve(`@mfng/shared-app/package.json`)),
              `static`,
            ),
          },
        ],
      }),
      new MiniCssExtractPlugin({
        filename: dev ? `main.css` : `main.[contenthash:8].css`,
        runtime: false,
      }),
      new WebpackManifestPlugin({
        fileName: cssManifestFilename,
        publicPath: `/client/`,
        filter: (file) => file.path.endsWith(`.css`),
      }),
      new WebpackManifestPlugin({
        fileName: jsManifestFilename,
        publicPath: `/client/`,
        filter: (file) => file.path.endsWith(`.js`),
      }),
      new WebpackRscClientPlugin({
        clientReferencesMap,
        clientManifestFilename: path.relative(
          clientOutputDirname,
          reactClientManifestFilename,
        ),
        ssrManifestFilename: path.relative(
          clientOutputDirname,
          reactSsrManifestFilename,
        ),
      }),
    ],
    devtool: `source-map`,
    mode,
    stats,
  };

  return [serverConfig, clientConfig];
}
