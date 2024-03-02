'use client';

import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {trackClick} from '../server/track-click.js';

export type ButtonProps = React.PropsWithChildren<{}>;

export function Button({children}: ButtonProps): React.ReactNode {
  const {pending} = ReactDOM.useFormStatus();

  return (
    <button
      onClick={() => void trackClick()}
      disabled={pending}
      className="rounded-full bg-cyan-500 py-1 px-4 text-white disabled:bg-zinc-300"
    >
      {children}
    </button>
  );
}
