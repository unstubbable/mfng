'use client';

import * as React from 'react';
import {useHistory} from '../../hooks/use-history.js';

export interface ClientRootProps {
  readonly fetchJsxStream: (pathname: string) => React.Thenable<JSX.Element>;
}

export function ClientRoot({fetchJsxStream}: ClientRootProps): JSX.Element {
  const history = useHistory();
  const [pathname, setPathname] = React.useState(history.location.pathname);

  React.useEffect(
    () => history.listen(({location}) => setPathname(location.pathname)),
    [],
  );

  return React.use(fetchJsxStream(pathname));
}
