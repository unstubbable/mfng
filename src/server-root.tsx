import {createMemoryHistory} from 'history';
import * as React from 'react';
import {HistoryContext} from './hooks/use-history.js';

export interface ServerRootProps {
  readonly jsxStream: React.Thenable<JSX.Element>;
}

export function ServerRoot({jsxStream}: ServerRootProps): JSX.Element {
  return (
    <HistoryContext.Provider value={createMemoryHistory()}>
      {React.use(jsxStream)}
    </HistoryContext.Provider>
  );
}
