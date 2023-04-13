// @ts-nocheck
/* eslint-disable @typescript-eslint/no-require-imports,import/no-commonjs */

// These json imports will be preserved by webpack, and then bundled by vercel
// into the final edge function bundle. This needs to be done in this way,
// because most of the manifests are only available after the client bundle has
// been created, at which point webpack has already emitted the server bundle.

export const reactServerManifest = require(/* webpackIgnore: true */ `./react-server-manifest.json`);
export const reactClientManifest = require(/* webpackIgnore: true */ `./react-client-manifest.json`);
export const reactSsrManifest = require(/* webpackIgnore: true */ `./react-ssr-manifest.json`);
export const cssManifest = require(/* webpackIgnore: true */ `./css-manifest.json`);
export const jsManifest = require(/* webpackIgnore: true */ `./js-manifest.json`);
