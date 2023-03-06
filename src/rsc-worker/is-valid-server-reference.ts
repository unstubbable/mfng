import type {ReactModel} from 'react-server-dom-webpack/server';

export function isValidServerReference(
  action: unknown,
): action is (...args: unknown[]) => Promise<ReactModel> {
  // TODO: Check against a server reference manifest.
  return (
    typeof action === `function` &&
    `$$typeof` in action &&
    action.$$typeof === Symbol.for(`react.server.reference`)
  );
}
