import {createRequire} from 'module';
import type {RuleSetUseItem} from 'webpack';
import type {WebpackRscClientLoaderOptions} from './webpack-rsc-client-loader.cjs';
import type {WebpackRscServerLoaderOptions} from './webpack-rsc-server-loader.cjs';

export * from './webpack-rsc-client-loader.cjs';
export * from './webpack-rsc-client-plugin.js';
export * from './webpack-rsc-server-loader.cjs';
export * from './webpack-rsc-server-plugin.js';
export * from './webpack-rsc-ssr-loader.cjs';

const require = createRequire(import.meta.url);
const serverLoader = require.resolve(`./webpack-rsc-server-loader.cjs`);
const ssrLoader = require.resolve(`./webpack-rsc-ssr-loader.cjs`);
const clientLoader = require.resolve(`./webpack-rsc-client-loader.cjs`);

export function createWebpackRscServerLoader(
  options: WebpackRscServerLoaderOptions,
): RuleSetUseItem {
  return {loader: serverLoader, options};
}

export function createWebpackRscSsrLoader(): RuleSetUseItem {
  return {loader: ssrLoader};
}

export function createWebpackRscClientLoader(
  options: WebpackRscClientLoaderOptions,
): RuleSetUseItem {
  return {loader: clientLoader, options};
}
