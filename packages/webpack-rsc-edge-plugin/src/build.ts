import {createClientConfig} from './configs/create-client-config.js';
import {createServerConfig} from './configs/create-server-config.js';
import {createSsrConfig} from './configs/create-ssr-config.js';
import {runWebpack} from './run-webpack.js';
import type {ClientReferencesForSsrMap} from './webpack-rsc-client-plugin.js';
import type {ClientReferencesForClientMap} from './webpack-rsc-server-loader.cjs';

const mode = process.env.MODE === `development` ? `development` : `production`;
const clientReferencesForClientMap: ClientReferencesForClientMap = new Map();
const clientReferencesForSsrMap: ClientReferencesForSsrMap = new Map();

await runWebpack(createServerConfig({mode, clientReferencesForClientMap}));

await runWebpack(
  createClientConfig({
    mode,
    clientReferencesForClientMap,
    clientReferencesForSsrMap,
  }),
);

await runWebpack(createSsrConfig({mode, clientReferencesForSsrMap}));
