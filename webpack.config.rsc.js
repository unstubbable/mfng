import path from 'path';
import url from 'url';
import {baseConfig} from './webpack.config.js';

const dev = process.env.MODE === `development`;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * @type {import('webpack').Configuration}
 */
export default {
  ...baseConfig,
  entry: `./src/rsc-worker/index.tsx`,
  output: {
    filename: `rsc-worker.js`,
    path: path.join(__dirname, `dist`),
    libraryTarget: `module`,
    chunkFormat: `module`,
  },
  resolve: {
    ...baseConfig.resolve,
    conditionNames: [`react-server`, `workerd`, `import`, `require`],
  },
  experiments: {outputModule: true},
  performance: {
    maxAssetSize: 1_000_000,
    maxEntrypointSize: 1_000_000,
  },
  resolveLoader: {
    modules: [`node_modules`, __dirname],
  },
  module: {
    rules: [
      ...(baseConfig.module?.rules || []),
      {
        test: /\.tsx?$/,
        use: [
          {loader: path.resolve(__dirname, `rsc-loader.cjs`)},
          `swc-loader`,
        ],
        exclude: [/node_modules/],
      },
    ],
  },
  externals: [`__STATIC_CONTENT_MANIFEST`],
  // Do not mangle exports so that server references can be imported by name.
  optimization: dev ? undefined : {mangleExports: false},
};
