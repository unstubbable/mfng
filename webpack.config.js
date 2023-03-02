import path from 'path';
import url from 'url';
import CopyPlugin from 'copy-webpack-plugin';
import ReactFlightWebpackPlugin from 'react-server-dom-webpack/plugin';
import ResolveTypeScriptPlugin from 'resolve-typescript-plugin';

const dev = process.env.MODE === `development`;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * @type {import('webpack').Configuration}
 */
export const baseConfig = {
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
  entry: `./src/html-worker/index.ts`,
  output: {
    filename: `html-worker.js`,
    path: path.join(__dirname, `dist`),
    libraryTarget: `module`,
    chunkFormat: `module`,
  },
  resolve: {
    ...baseConfig.resolve,
    conditionNames: [`workerd`, `node`, `import`, `require`],
  },
  experiments: {outputModule: true},
  performance: {
    maxAssetSize: 1_000_000,
    maxEntrypointSize: 1_000_000,
  },
  optimization: dev
    ? undefined
    : {concatenateModules: false, usedExports: false, moduleIds: `hashed`},
};

/**
 * @type {import('webpack').Configuration}
 */
const clientConfig = {
  ...baseConfig,
  entry: `./src/client.tsx`,
  output: {
    filename: `main.js`,
    path: path.join(__dirname, `dist/client`),
    clean: !dev,
  },
  plugins: [
    new CopyPlugin({patterns: [{from: `static`}]}),
    new ReactFlightWebpackPlugin({
      isServer: false,
      clientReferences: {
        directory: `./src/client-components`,
        include: /\.tsx$/,
      },
    }),
  ],
  optimization: dev ? undefined : {moduleIds: `hashed`},
};

export default [serverConfig, clientConfig];
