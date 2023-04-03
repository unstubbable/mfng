import path from 'path';
import url from 'url';
import {
  WebpackRscClientPlugin,
  WebpackRscServerPlugin,
  WebpackRscSsrPlugin,
  createWebpackRscServerLoader,
} from '@mfng/webpack-rsc';
import CopyPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ResolveTypeScriptPlugin from 'resolve-typescript-plugin';
import {WebpackManifestPlugin} from 'webpack-manifest-plugin';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

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
   * @type {import('@mfng/webpack-rsc').ClientReferencesForClientMap}
   */
  const clientReferencesForClientMap = new Map();

  /**
   * @type {import('@mfng/webpack-rsc').ClientReferencesForSsrMap}
   */
  const clientReferencesForSsrMap = new Map();

  /**
   * @type {import('webpack').Configuration}
   */
  const serverConfig = {
    name: `server`,
    entry: `./src/workers/rsc/index.tsx`,
    target: `webworker`,
    output: {
      filename: `rsc-worker.js`,
      path: path.join(currentDirname, `dist`),
      libraryTarget: `module`,
      chunkFormat: `module`,
    },
    resolve: {
      plugins: [new ResolveTypeScriptPlugin()],
      conditionNames: [`react-server`, `workerd`, `node`, `import`, `require`],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: [
            createWebpackRscServerLoader({clientReferencesForClientMap}),
            `swc-loader`,
          ],
          exclude: [/node_modules/],
        },
        {test: /\.md$/, type: `asset/source`},
        cssRule,
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({filename: `rsc-main.css`, runtime: false}),
      new WebpackRscServerPlugin(),
    ],
    experiments: {outputModule: true},
    performance: {maxAssetSize: 1_000_000, maxEntrypointSize: 1_000_000},
    externals: [`__STATIC_CONTENT_MANIFEST`],
    devtool: `source-map`,
    mode,
    stats,
  };

  /**
   * @type {import('webpack').Configuration}
   */
  const clientConfig = {
    name: `client`,
    dependencies: [`server`],
    entry: `./src/client.tsx`,
    output: {
      filename: dev ? `main.js` : `main.[contenthash:8].js`,
      path: path.join(process.cwd(), `dist/client`),
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
        fileName: `css-manifest.json`,
        publicPath: `/client/`,
        filter: (file) => file.path.endsWith(`.css`),
      }),
      new WebpackManifestPlugin({
        fileName: `js-manifest.json`,
        publicPath: `/client/`,
        filter: (file) => file.path.endsWith(`.js`),
      }),
      new WebpackRscClientPlugin({
        clientReferencesForClientMap,
        clientReferencesForSsrMap,
      }),
    ],
    devtool: `source-map`,
    mode,
    stats,
  };

  /**
   * @type {import('webpack').Configuration}
   */
  const ssrConfig = {
    name: `ssr`,
    dependencies: [`client`],
    entry: `./src/workers/main/index.ts`,
    target: `webworker`,
    output: {
      filename: `main-worker.js`,
      path: path.join(process.cwd(), `dist`),
      libraryTarget: `module`,
      chunkFormat: `module`,
    },
    resolve: {
      plugins: [new ResolveTypeScriptPlugin()],
      conditionNames: [`workerd`, `node`, `import`, `require`],
    },
    module: {
      rules: [
        {test: /\.tsx?$/, loader: `swc-loader`, exclude: [/node_modules/]},
        {test: /\.md$/, type: `asset/source`},
        cssRule,
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({filename: `ssr-main.css`, runtime: false}),
      new WebpackRscSsrPlugin({clientReferencesForSsrMap}),
    ],
    experiments: {outputModule: true},
    performance: {maxAssetSize: 1_000_000, maxEntrypointSize: 1_000_000},
    externals: [`__STATIC_CONTENT_MANIFEST`],
    devtool: `source-map`,
    mode,
    stats,
  };

  return [serverConfig, clientConfig, ssrConfig];
}
