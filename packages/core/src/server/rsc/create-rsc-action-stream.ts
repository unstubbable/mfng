import type {ClientManifest, ServerManifest} from 'react-server-dom-webpack';
import ReactServerDOMServer from 'react-server-dom-webpack/server.edge';

export interface CreateRscActionStreamOptions {
  /**
   * Form data file entry values are not supported yet.
   */
  readonly body: string | FormData;
  readonly serverReferenceId: string;
  readonly reactClientManifest: ClientManifest;
  readonly reactServerManifest: ServerManifest;
}

declare var __webpack_require__: (
  moduleId: string | number,
) => Record<string, unknown>;

export async function createRscActionStream(
  options: CreateRscActionStreamOptions,
): Promise<ReadableStream<Uint8Array> | undefined> {
  const {body, serverReferenceId, reactClientManifest, reactServerManifest} =
    options;

  const serverReference = reactServerManifest[serverReferenceId];

  if (!serverReference) {
    console.error(
      `Unknown server reference ID: ${JSON.stringify(serverReferenceId)}`,
    );

    console.debug(
      `React server manifest:`,
      JSON.stringify(reactServerManifest, null, 2),
    );

    return undefined;
  }

  const action = __webpack_require__(serverReference.id)[serverReference.name];

  if (typeof action !== `function`) {
    console.error(
      `The resolved server reference ${JSON.stringify(
        serverReferenceId,
      )} is not a function.`,
      action,
    );

    return undefined;
  }

  const args = await ReactServerDOMServer.decodeReply(
    body,
    reactServerManifest,
  );

  const actionPromise = action.apply(null, args);

  return ReactServerDOMServer.renderToReadableStream(
    actionPromise,
    reactClientManifest,
  );
}
