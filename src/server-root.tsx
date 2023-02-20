import * as React from 'react';

export interface ServerRootProps {
  readonly jsxStream: React.Thenable<JSX.Element>;
}

export function ServerRoot({jsxStream}: ServerRootProps): JSX.Element {
  return React.use(jsxStream);
}
