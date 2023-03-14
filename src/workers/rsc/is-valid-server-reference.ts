import type {ReactClientValue} from 'react-server-dom-webpack';

export function isValidServerReference(
  action: unknown,
): action is (...args: unknown[]) => Promise<ReactClientValue> {
  // TODO: Check against a server reference manifest.
  return (
    typeof action === `function` &&
    `$$typeof` in action &&
    action.$$typeof === Symbol.for(`react.server.reference`)
  );
}
