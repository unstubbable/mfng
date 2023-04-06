import fs from 'fs';
import path from 'path';
import {
  WebpackRscClientPlugin,
  WebpackRscServerPlugin,
  createWebpackRscServerLoader,
  webpackRscLayerName,
} from '@mfng/webpack-rsc';
import CopyPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ResolveTypeScriptPlugin from 'resolve-typescript-plugin';
import webpack from 'webpack';
import {WebpackManifestPlugin} from 'webpack-manifest-plugin';

const distDirname = path.join(process.cwd(), `dist`);

const reactServerManifestFilename = path.join(
  distDirname,
  `react-server-manifest.json`,
);

const reactClientManifestFilename = path.join(
  distDirname,
  `react-client-manifest.json`,
);

const reactSsrManifestFilename = path.join(
  distDirname,
  `react-ssr-manifest.json`,
);

const jsManifestFilename = path.join(distDirname, `js-manifest.json`);
const cssManifestFilename = path.join(distDirname, `css-manifest.json`);

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
    colors: true,
    chunks: false,
    modules: false,
    version: false,
    hash: false,
    builtAt: true,
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

  /**
   * @type {import('webpack').Configuration}
   */
  const serverConfig = {
    name: `server`,
    entry: `./src/edge-function-handler/index.ts`,
    target: `webworker`,
    output: {
      filename: `index.js`,
      path: distDirname,
      libraryTarget: `module`,
      chunkFormat: `module`,
    },
    resolve: {
      plugins: [new ResolveTypeScriptPlugin()],
      conditionNames: [`workerd`, `...`],
    },
    module: {
      rules: [
        {
          resource: (value) =>
            /core\/lib\/server\/rsc\.js$/.test(value) ||
            /create-rsc-app-options\.tsx$/.test(value),
          layer: webpackRscLayerName,
        },
        {
          issuerLayer: webpackRscLayerName,
          resolve: {conditionNames: [`react-server`, `...`]},
        },
        {
          oneOf: [
            {
              issuerLayer: webpackRscLayerName,
              test: /\.tsx?$/,
              use: [
                createWebpackRscServerLoader({clientReferencesMap}),
                `swc-loader`,
              ],
              exclude: [/node_modules/],
            },
            {test: /\.tsx?$/, loader: `swc-loader`, exclude: [/node_modules/]},
          ],
        },
        {test: /\.md$/, type: `asset/source`},
        cssRule,
      ],
    },
    plugins: [
      // server-main.css is not used, but required by MiniCssExtractPlugin.
      new MiniCssExtractPlugin({filename: `server-main.css`, runtime: false}),
      new WebpackRscServerPlugin({
        clientReferencesMap,
        serverManifestFilename: path.relative(
          distDirname,
          reactServerManifestFilename,
        ),
      }),
    ],
    experiments: {outputModule: true, layers: true},
    performance: {maxAssetSize: 1_000_000, maxEntrypointSize: 1_000_000},
    externals: [`__STATIC_CONTENT_MANIFEST`],
    devtool: `source-map`,
    mode,
    stats,
  };

  const clientOutputDirname = path.join(distDirname, `client`);

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
    },
    module: {
      rules: [
        {test: /\.tsx?$/, loader: `swc-loader`, exclude: [/node_modules/]},
        cssRule,
      ],
    },
    plugins: [
      new CopyPlugin({patterns: [{from: `static`}]}),
      new MiniCssExtractPlugin({
        filename: dev ? `main.css` : `main.[contenthash:8].css`,
        runtime: false,
      }),
      new WebpackManifestPlugin({
        fileName: path.relative(clientOutputDirname, cssManifestFilename),
        publicPath: `/client/`,
        filter: (file) => file.path.endsWith(`.css`),
      }),
      new WebpackManifestPlugin({
        fileName: path.relative(clientOutputDirname, jsManifestFilename),
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

  /**
   * @type {import('webpack').Configuration}
   */
  const vercelOutputConfig = {
    name: `vercel-output`,
    dependencies: [`server`, `client`],
    entry: `./dist/index.js`,
    output: {
      filename: `functions/index.func/index.js`,
      path: path.join(process.cwd(), `.vercel/output`),
      libraryTarget: `module`,
      chunkFormat: `module`,
    },
    module: {
      rules: [
        {test: /\.js$/, enforce: `pre`, use: `source-map-loader`},
        {test: /\.js$/, loader: `swc-loader`, exclude: [/node_modules/]},
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        REACT_SERVER_MANIFEST: webpack.DefinePlugin.runtimeValue(
          () => fs.readFileSync(reactServerManifestFilename).toString(),
          {fileDependencies: [reactServerManifestFilename]},
        ),
        REACT_CLIENT_MANIFEST: webpack.DefinePlugin.runtimeValue(
          () => fs.readFileSync(reactClientManifestFilename).toString(),
          {fileDependencies: [reactClientManifestFilename]},
        ),
        REACT_SSR_MANIFEST: webpack.DefinePlugin.runtimeValue(
          () => fs.readFileSync(reactSsrManifestFilename).toString(),
          {fileDependencies: [reactSsrManifestFilename]},
        ),
        CSS_MANIFEST: webpack.DefinePlugin.runtimeValue(
          () => fs.readFileSync(cssManifestFilename).toString(),
          {fileDependencies: [cssManifestFilename]},
        ),
        JS_MANIFEST: webpack.DefinePlugin.runtimeValue(
          () => fs.readFileSync(jsManifestFilename).toString(),
          {fileDependencies: [jsManifestFilename]},
        ),
      }),
      new CopyPlugin({
        patterns: [
          {
            from: `src/edge-function-handler/.vc-config.json`,
            to: `functions/index.func/`,
          },
          {from: `src/edge-function-handler/config.json`},
          {from: `dist/client`, to: `static/client`},
        ],
      }),
    ],
    experiments: {outputModule: true},
    performance: {maxAssetSize: 1_000_000, maxEntrypointSize: 1_000_000},
    devtool: `source-map`,
    mode,
    stats,
  };

  return [serverConfig, clientConfig, vercelOutputConfig];
}
