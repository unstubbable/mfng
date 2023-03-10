import path from 'path';
import url from 'url';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ResolveTypeScriptPlugin from 'resolve-typescript-plugin';
import {cssRule} from './webpack.config.js';

const dev = process.env.MODE === `development`;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * @type {import('webpack').Configuration}
 */
export default {
  entry: `./src/workers/rsc/index.tsx`,
  output: {
    filename: `rsc-worker.js`,
    path: path.join(__dirname, `dist`),
    libraryTarget: `module`,
    chunkFormat: `module`,
  },
  resolve: {
    plugins: [new ResolveTypeScriptPlugin()],
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
      {
        test: /\.tsx?$/,
        use: [
          {loader: path.resolve(__dirname, `rsc-loader.cjs`)},
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
  ],
  devtool: `source-map`,
  mode: dev ? `development` : `production`,
  externals: [`__STATIC_CONTENT_MANIFEST`],
  // Do not mangle exports so that server references can be imported by name.
  optimization: dev ? undefined : {mangleExports: false},
};
