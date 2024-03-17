// @ts-nocheck
'use client';

import {useUIState} from 'ai/rsc';

export function ClientComponent1() {
  const [, setStuff] = useUIState();

  React.useEffect(() => {
    setStuff([]);
  }, []);

  return null;
}
