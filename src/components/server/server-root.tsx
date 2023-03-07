import type {History} from 'history';
import * as React from 'react';
import {HistoryContext} from '../../hooks/use-history.js';

export interface ServerRootProps {
  readonly history: History;
  readonly jsxStream: React.Thenable<JSX.Element>;
}

export function ServerRoot({history, jsxStream}: ServerRootProps): JSX.Element {
  return (
    <HistoryContext.Provider value={history}>
      {React.use(jsxStream)}
    </HistoryContext.Provider>
  );
}
