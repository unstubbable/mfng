import * as React from 'react';

export function Main({children}: React.PropsWithChildren): React.ReactNode {
  return <main className="m-4">{children}</main>;
}
