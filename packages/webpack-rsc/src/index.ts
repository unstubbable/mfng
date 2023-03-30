import {createRequire} from 'module';
import type {RuleSetUseItem} from 'webpack';
import type {WebpackRscServerLoaderOptions} from './webpack-rsc-server-loader.cjs';

export * from './webpack-rsc-client-plugin.js';
export * from './webpack-rsc-server-loader.cjs';
export * from './webpack-rsc-server-plugin.js';
export * from './webpack-rsc-ssr-plugin.js';

const require = createRequire(import.meta.url);
const loader = require.resolve(`./webpack-rsc-server-loader.cjs`);

export function createWebpackRscServerLoader(
  options: WebpackRscServerLoaderOptions,
): RuleSetUseItem {
  return {loader, options};
}
