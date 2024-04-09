'use client';

import * as React from 'react';
import {trackClick} from '../server/track-click.js';

export type ButtonProps = React.PropsWithChildren<{
  readonly disabled?: boolean;
}>;

export function Button({children, disabled}: ButtonProps): React.ReactNode {
  return (
    <button
      onClick={() => void trackClick()}
      disabled={disabled}
      className="rounded-full bg-cyan-500 py-1 px-4 text-white disabled:bg-zinc-300"
    >
      {children}
    </button>
  );
}
