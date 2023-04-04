import type {ClientManifest, SSRManifest} from 'react-server-dom-webpack';

export function translateReactSsrManifest(
  reactSsrManifest: ClientManifest,
  reactClientManifest: ClientManifest,
): SSRManifest {
  const manifest: SSRManifest = {};

  for (const [id, ssrMetaData] of Object.entries(reactSsrManifest)) {
    const clientMetaData = reactClientManifest[id];

    if (!clientMetaData) {
      console.warn(
        `Could not find meta data in React client manifest for ID ${id}.`,
      );

      continue;
    }

    manifest[clientMetaData.id] = {
      ...manifest[clientMetaData.id],
      [clientMetaData.name]: ssrMetaData,
    };
  }

  return manifest;
}
