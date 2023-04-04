import {getAssetFromKV} from '@cloudflare/kv-asset-handler';
import staticContentManifest from '__STATIC_CONTENT_MANIFEST';

export interface EnvWithStaticContent {
  __STATIC_CONTENT: {};
}

export interface HandlerParams {
  readonly request: Request;
  readonly env: EnvWithStaticContent;
  readonly ctx: ExecutionContext;
}

const assetManifest = JSON.parse(staticContentManifest);

export async function getJsonFromKv<T>(
  pathname: string,
  params: HandlerParams,
): Promise<T> {
  const {request, env, ctx} = params;
  const {origin} = new URL(request.url);

  const asset = await getAssetFromKV(
    {
      request: new Request(new URL(pathname, origin)),
      waitUntil: ctx.waitUntil.bind(ctx),
    },
    {ASSET_NAMESPACE: env.__STATIC_CONTENT, ASSET_MANIFEST: assetManifest},
  );

  return asset.json();
}
