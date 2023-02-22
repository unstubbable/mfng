import path from 'path';
import url from 'url';
import CopyPlugin from 'copy-webpack-plugin';
import ResolveTypeScriptPlugin from 'resolve-typescript-plugin';

const dev = process.env.MODE === `development`;

/**
 * @type {import('webpack').Configuration}
 */
const baseConfig = {
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: `swc-loader`,
        exclude: [/node_modules/],
      },
    ],
  },
  resolve: {
    plugins: [new ResolveTypeScriptPlugin()],
  },
  devtool: `source-map`,
  mode: dev ? `development` : `production`,
};

/**
 * @type {import('webpack').Configuration}
 */
const serverConfig = {
  ...baseConfig,
  entry: `./src/index.tsx`,
  output: {
    filename: `index.js`,
    path: path.join(path.dirname(url.fileURLToPath(import.meta.url)), `dist`),
    libraryTarget: `module`,
    chunkFormat: `module`,
  },
  resolve: {
    ...baseConfig.resolve,
    conditionNames: [`react-server`, `node`, `import`, `require`],
  },
  experiments: {outputModule: true},
  performance: {
    maxAssetSize: 1_000_000,
    maxEntrypointSize: 1_000_000,
  },
};

/**
 * @type {import('webpack').Configuration}
 */
const clientConfig = {
  ...baseConfig,
  entry: `./src/client.tsx`,
  output: {
    filename: `main.js`,
    path: path.join(
      path.dirname(url.fileURLToPath(import.meta.url)),
      `dist/client`,
    ),
  },
  plugins: [new CopyPlugin({patterns: [{from: `static`}]})],
};

export default [serverConfig, clientConfig];
