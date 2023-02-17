import path from 'path';
import url from 'url';

/**
 * @type {import('webpack').Configuration}
 */
export default {
  entry: `./src/index.ts`,
  target: `node`,
  output: {
    filename: `index.cjs`,
    path: path.join(path.dirname(url.fileURLToPath(import.meta.url)), `dist`),
    libraryTarget: `commonjs`,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        loader: `swc-loader`,
        exclude: [/node_modules/],
      },
    ],
  },
};
