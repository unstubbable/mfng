import path from 'path';
import url from 'url';
import ResolveTypeScriptPlugin from 'resolve-typescript-plugin';

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
};

/**
 * @type {import('webpack').Configuration}
 */
const serverConfig = {
  ...baseConfig,
  entry: `./src/index.tsx`,
  target: `node`,
  output: {
    filename: `index.cjs`,
    path: path.join(path.dirname(url.fileURLToPath(import.meta.url)), `dist`),
    libraryTarget: `commonjs`,
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
};

export default [serverConfig, clientConfig];
