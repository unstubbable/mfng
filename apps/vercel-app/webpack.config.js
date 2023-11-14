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
import webpack from 'webpack';
import {WebpackManifestPlugin} from 'webpack-manifest-plugin';

const require = createRequire(import.meta.url);
const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));
const outputDirname = path.join(currentDirname, `.vercel/output`);
const outputFunctionDirname = path.join(outputDirname, `functions/index.func`);

const reactServerManifestFilename = path.join(
  outputFunctionDirname,
  `react-server-manifest.json`,
);

const reactClientManifestFilename = path.join(
  outputFunctionDirname,
  `react-client-manifest.json`,
);

const reactSsrManifestFilename = path.join(
  outputFunctionDirname,
  `react-ssr-manifest.json`,
);

const jsManifestFilename = path.join(outputFunctionDirname, `js-manifest.json`);

const cssManifestFilename = path.join(
  outputFunctionDirname,
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
  const rscServerLoader = createWebpackRscServerLoader({clientReferencesMap});
  const rscSsrLoader = createWebpackRscSsrLoader();
  const rscClientLoader = createWebpackRscClientLoader({serverReferencesMap});

  /**
   * @type {import('webpack').Configuration}
   */
  const serverConfig = {
    name: `server`,
    entry: `./src/edge-function-handler/index.tsx`,
    target: `webworker`,
    output: {
      filename: `index.js`,
      path: outputFunctionDirname,
      libraryTarget: `module`,
      chunkFormat: `module`,
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
          resource: [/rsc\.ts$/, /app\.tsx$/],
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
              use: [rscServerLoader, `swc-loader`],
              exclude: [/node_modules/],
            },
            {
              test: /\.tsx?$/,
              use: [rscSsrLoader, `swc-loader`],
              // use: `swc-loader`,
              exclude: [/node_modules/],
            },
          ],
        },
        {
          oneOf: [
            {
              test: /\.js$/,
              issuerLayer: webpackRscLayerName,
              use: rscServerLoader,
            },
            {test: /\.js$/, use: rscSsrLoader},
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
          outputFunctionDirname,
          reactServerManifestFilename,
        ),
      }),
      new CopyPlugin({
        patterns: [{from: `src/edge-function-handler/.vc-config.json`}],
      }),
    ],
    experiments: {outputModule: true, layers: true},
    performance: {maxAssetSize: 1_000_000, maxEntrypointSize: 1_000_000},
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
        {test: /\.js$/, use: rscClientLoader},
        {
          test: /\.tsx?$/,
          use: [rscClientLoader, `swc-loader`],
          exclude: [/node_modules/],
        },
        cssRule,
      ],
    },
    plugins: [
      new webpack.EnvironmentPlugin({VERCEL_ANALYTICS_ID: ``}),
      new CopyPlugin({
        patterns: [
          {
            from: path.join(
              path.dirname(require.resolve(`@mfng/shared-app/package.json`)),
              `static`,
            ),
          },
          {from: `src/config.json`, to: outputDirname},
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
