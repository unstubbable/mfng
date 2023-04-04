import type {ClientManifest, SSRManifest} from 'react-server-dom-webpack';
import type {ServerManifest} from './create-rsc-action-stream.js';
import type {HandlerParams} from './get-json-from-kv.js';
import {getJsonFromKv} from './get-json-from-kv.js';

export interface Manifests {
  readonly reactServerManifest: ServerManifest;
  readonly reactClientManifest: ClientManifest;
  readonly reactSsrManifest: SSRManifest;
  readonly jsManifest: Record<string, string>;
  readonly cssManifest: Record<string, string>;
}

export async function readManifests(params: HandlerParams): Promise<Manifests> {
  const [
    reactServerManifest,
    reactClientManifest,
    reactSsrManifest,
    jsManifest,
    cssManifest,
  ] = await Promise.all([
    getJsonFromKv<ServerManifest>(`react-server-manifest.json`, params),
    getJsonFromKv<ClientManifest>(`client/react-client-manifest.json`, params),
    getJsonFromKv<SSRManifest>(`client/react-ssr-manifest.json`, params),
    getJsonFromKv<Record<string, string>>(`client/js-manifest.json`, params),
    getJsonFromKv<Record<string, string>>(`client/css-manifest.json`, params),
  ]);

  return {
    reactServerManifest,
    reactClientManifest,
    reactSsrManifest,
    jsManifest,
    cssManifest,
  };
}
