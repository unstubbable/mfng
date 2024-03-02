'use client';

import {useRouter} from '@mfng/core/client';
import {clsx} from 'clsx';
import * as React from 'react';

export function NavigationContainer({
  children,
}: React.PropsWithChildren): React.ReactNode {
  const {isPending} = useRouter();

  return (
    <div
      className={clsx(`opacity-100`, `transition-opacity`, {
        [`opacity-60`]: isPending,
      })}
    >
      {children}
    </div>
  );
}
