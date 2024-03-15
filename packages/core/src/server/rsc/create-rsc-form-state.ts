import type {ReactFormState} from 'react-dom/server';
import type {ServerManifest} from 'react-server-dom-webpack';
import ReactServerDOMServer from 'react-server-dom-webpack/server.edge';

export async function createRscFormState(
  formData: FormData,
  reactServerManifest: ServerManifest,
): Promise<ReactFormState | undefined> {
  const action = await ReactServerDOMServer.decodeAction(
    formData,
    reactServerManifest,
  );

  if (!action) {
    return undefined;
  }

  const result = await action();

  const formState = await ReactServerDOMServer.decodeFormState(
    result,
    formData,
    reactServerManifest,
  );

  return formState ?? undefined;
}
