// @ts-nocheck

export const reactServerManifest = await import(
  /* webpackIgnore: true */ `./react-server-manifest.json`,
  {assert: {type: 'json'}}
);

export const reactClientManifest = await import(
  /* webpackIgnore: true */ `./react-client-manifest.json`,
  {assert: {type: 'json'}}
);

export const reactSsrManifest = await import(
  /* webpackIgnore: true */ `./react-ssr-manifest.json`,
  {assert: {type: 'json'}}
);

export const cssManifest = await import(
  /* webpackIgnore: true */ `./css-manifest.json`,
  {assert: {type: 'json'}}
);

export const jsManifest = await import(
  /* webpackIgnore: true */ `./js-manifest.json`,
  {assert: {type: 'json'}}
);
