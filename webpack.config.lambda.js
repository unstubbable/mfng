import path from 'path';
import url from 'url';
import ResolveTypeScriptPlugin from 'resolve-typescript-plugin';

const dev = process.env.MODE === `development`;
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

/**
 * @type {import('webpack').Configuration}
 */
export default {
  entry: `./src/lambda-function/index.ts`,
  output: {
    filename: `index.mjs`,
    path: path.join(__dirname, `dist/rsc-lambda`),
    libraryTarget: `module`,
    chunkFormat: `module`,
  },
  target: `node`,
  resolve: {plugins: [new ResolveTypeScriptPlugin()]},
  module: {
    rules: [{test: /\.ts$/, use: `swc-loader`, exclude: [/node_modules/]}],
  },
  devtool: `source-map`,
  mode: dev ? `development` : `production`,
  externals: [`aws-crt`],
  externalsType: `node-commonjs`,
  experiments: {outputModule: true, topLevelAwait: true},
};
