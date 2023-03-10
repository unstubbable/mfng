import * as React from 'react';

export function Main({children}: React.PropsWithChildren): JSX.Element {
  return <main className="m-4">{children}</main>;
}
