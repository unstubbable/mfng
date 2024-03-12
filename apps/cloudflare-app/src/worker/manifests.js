// @ts-nocheck

// These json imports will be preserved by webpack, and then bundled by wrangler
// into the final worker bundle. This needs to be done in this way,
// because most of the manifests are only available after the client bundle has
// been created, at which point webpack has already emitted the server bundle.

export const reactServerManifest = require(/* webpackIgnore: true */ `./react-server-manifest.json`);
export const reactClientManifest = require(/* webpackIgnore: true */ `./client/react-client-manifest.json`);
export const reactSsrManifest = require(/* webpackIgnore: true */ `./client/react-ssr-manifest.json`);
export const cssManifest = require(/* webpackIgnore: true */ `./client/css-manifest.json`);
export const jsManifest = require(/* webpackIgnore: true */ `./client/js-manifest.json`);
