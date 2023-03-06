import type {History} from 'history';
import * as React from 'react';

export const HistoryContext = React.createContext<History | undefined>(
  undefined,
);
export function useHistory(): History {
  const history = React.useContext(HistoryContext);

  if (!history) {
    throw new Error(`HistoryContext provider is missing.`);
  }

  return history;
}
