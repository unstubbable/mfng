import {createRequire} from 'module';
import type {RuleSetUseItem} from 'webpack';
import type {WebpackRscClientLoaderOptions} from './webpack-rsc-client-loader.cjs';
import type {WebpackRscServerLoaderOptions} from './webpack-rsc-server-loader.cjs';
import type {WebpackRscSsrLoaderOptions} from './webpack-rsc-ssr-loader.cjs';

export type {WebpackRscClientLoaderOptions} from './webpack-rsc-client-loader.cjs';

export * from './webpack-rsc-client-plugin.js';

export type {
  ClientReference,
  ClientReferencesMap,
  ServerReferencesMap,
  ServerReferencesModuleInfo,
  WebpackRscServerLoaderOptions,
} from './webpack-rsc-server-loader.cjs';

export * from './webpack-rsc-server-plugin.js';

const require = createRequire(import.meta.url);
const serverLoader = require.resolve(`./webpack-rsc-server-loader.cjs`);
const ssrLoader = require.resolve(`./webpack-rsc-ssr-loader.cjs`);
const clientLoader = require.resolve(`./webpack-rsc-client-loader.cjs`);

export function createWebpackRscServerLoader(
  options: WebpackRscServerLoaderOptions,
): RuleSetUseItem {
  return {loader: serverLoader, options};
}

export function createWebpackRscSsrLoader(
  options: WebpackRscSsrLoaderOptions,
): RuleSetUseItem {
  return {loader: ssrLoader, options};
}

export function createWebpackRscClientLoader(
  options: WebpackRscClientLoaderOptions,
): RuleSetUseItem {
  return {loader: clientLoader, options};
}
