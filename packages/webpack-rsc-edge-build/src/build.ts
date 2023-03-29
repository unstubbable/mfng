#!/usr/bin/env node
import {createClientConfig} from './configs/create-client-config.js';
import {createServerConfig} from './configs/create-server-config.js';
import {createSsrConfig} from './configs/create-ssr-config.js';
import {parseArgs} from './parse-args.js';
import {readBuildConfig} from './read-build-config.js';
import {runWebpack} from './run-webpack.js';
import type {ClientReferencesForSsrMap} from './webpack-rsc-client-plugin.js';
import type {ClientReferencesForClientMap} from './webpack-rsc-server-loader.cjs';

const clientReferencesForClientMap: ClientReferencesForClientMap = new Map();
const clientReferencesForSsrMap: ClientReferencesForSsrMap = new Map();
const buildConfig = await readBuildConfig();
const {mode, watch} = parseArgs();

runWebpack(
  {
    server: createServerConfig({
      mode,
      entry: buildConfig[`react-server`],
      clientReferencesForClientMap,
    }),
    client: createClientConfig({
      mode,
      entry: buildConfig.browser,
      clientReferencesForClientMap,
      clientReferencesForSsrMap,
    }),
    ssr: createSsrConfig({
      mode,
      entry: buildConfig.default,
      clientReferencesForSsrMap,
    }),
  },
  {watch},
);
