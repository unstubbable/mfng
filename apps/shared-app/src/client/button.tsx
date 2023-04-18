'use client';

import * as React from 'react';
import {trackClick} from '../server/track-click.js';

export type ButtonProps = React.PropsWithChildren<{
  readonly disabled?: boolean;
  readonly onClick: React.MouseEventHandler<HTMLButtonElement>;
}>;

export function Button({
  children,
  disabled,
  onClick,
}: ButtonProps): JSX.Element {
  return (
    <button
      onClick={(event) => {
        onClick(event);
        void trackClick();
      }}
      disabled={disabled}
      className="rounded-full bg-cyan-500 py-1 px-4 text-white disabled:bg-zinc-300"
      type="button"
    >
      {children}
    </button>
  );
}
