import type {ClientManifest} from 'react-server-dom-webpack';
import ReactServerDOMServer from 'react-server-dom-webpack/server.edge';

export type ServerManifest = Record<string, string[]>;

export interface CreateRscActionStreamOptions {
  readonly body: string;
  readonly serverReferenceId: string;
  readonly reactClientManifest: ClientManifest;
  readonly reactServerManifest: ServerManifest;
}

declare var __webpack_require__: (moduleId: string) => Record<string, unknown>;

export async function createRscActionStream(
  options: CreateRscActionStreamOptions,
): Promise<ReadableStream<Uint8Array> | undefined> {
  const {body, serverReferenceId, reactClientManifest, reactServerManifest} =
    options;

  const [moduleId, exportName] = serverReferenceId?.split(`#`) ?? [];

  if (!moduleId || !exportName) {
    console.error(
      `Invalid server reference ID: ${JSON.stringify(serverReferenceId)}`,
    );

    return undefined;
  }

  if (!reactServerManifest[moduleId]?.includes(exportName)) {
    console.error(
      `Unknown server reference ID: ${JSON.stringify(serverReferenceId)}`,
    );

    console.debug(
      `React server manifest:`,
      JSON.stringify(reactServerManifest, null, 2),
    );

    return undefined;
  }

  const action = __webpack_require__(moduleId)[exportName];

  if (typeof action !== `function`) {
    console.error(
      `The resolved server reference ${JSON.stringify(
        serverReferenceId,
      )} is not a function.`,
      action,
    );

    return undefined;
  }

  const args = await ReactServerDOMServer.decodeReply(body);
  const actionPromise = action.apply(null, args);

  return ReactServerDOMServer.renderToReadableStream(
    actionPromise,
    reactClientManifest,
  );
}
