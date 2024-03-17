// @ts-nocheck
'use client';

import {useUIState} from 'ai/rsc';

export function ClientComponent2() {
  const [, setStuff] = useUIState();

  React.useEffect(() => {
    setStuff([]);
  }, []);

  return null;
}
