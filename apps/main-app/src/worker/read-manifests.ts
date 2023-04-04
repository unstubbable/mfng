import type {ClientManifest, SSRManifest} from 'react-server-dom-webpack';
import type {ServerManifest} from './create-rsc-action-stream.js';
import type {HandlerParams} from './get-json-from-kv.js';
import {getJsonFromKv} from './get-json-from-kv.js';
import {translateReactSsrManifest} from './translate-react-ssr-manifest.js';

export interface Manifests {
  readonly reactServerManifest: ServerManifest;
  readonly reactSsrManifest: SSRManifest;
  readonly reactClientManifest: ClientManifest;
  readonly jsManifest: Record<string, string>;
  readonly cssManifest: Record<string, string>;
}

export async function readManifests(params: HandlerParams): Promise<Manifests> {
  const [
    reactServerManifest,
    reactSsrManifest,
    reactClientManifest,
    jsManifest,
    cssManifest,
  ] = await Promise.all([
    getJsonFromKv<ServerManifest>(`react-server-manifest.json`, params),
    getJsonFromKv<ClientManifest>(`react-ssr-manifest.json`, params),
    getJsonFromKv<ClientManifest>(`client/react-client-manifest.json`, params),
    getJsonFromKv<Record<string, string>>(`client/js-manifest.json`, params),
    getJsonFromKv<Record<string, string>>(`client/css-manifest.json`, params),
  ]);

  return {
    reactServerManifest,
    reactSsrManifest: translateReactSsrManifest(
      reactSsrManifest,
      reactClientManifest,
    ),
    reactClientManifest,
    jsManifest,
    cssManifest,
  };
}
