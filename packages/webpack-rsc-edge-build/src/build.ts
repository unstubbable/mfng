#!/usr/bin/env node
import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {z} from 'zod';
import {createClientConfig} from './configs/create-client-config.js';
import {createServerConfig} from './configs/create-server-config.js';
import {createSsrConfig} from './configs/create-ssr-config.js';
import {readBuildConfig} from './read-build-config.js';
import {runWebpack} from './run-webpack.js';
import type {ClientReferencesForSsrMap} from './webpack-rsc-client-plugin.js';
import type {ClientReferencesForClientMap} from './webpack-rsc-server-loader.cjs';

const clientReferencesForClientMap: ClientReferencesForClientMap = new Map();
const clientReferencesForSsrMap: ClientReferencesForSsrMap = new Map();
const buildConfig = await readBuildConfig();

const Argv = z.object({
  mode: z.union([z.literal(`development`), z.literal(`production`)]),
  watch: z.boolean(),
});

const {mode, watch} = Argv.parse(
  yargs(hideBin(process.argv))
    .epilogue(
      `Run a webpack build for an RSC app that's going to be deployed to the edge.`,
    )
    .options({
      mode: {
        string: true,
        choices: [`development`, `production`],
        default: `production`,
        describe: `Build mode`,
      },
      watch: {
        boolean: true,
        default: false,
        describe: `Enable watch mode`,
      },
    })
    .help()
    .alias(`h`, `help`).argv,
);

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
