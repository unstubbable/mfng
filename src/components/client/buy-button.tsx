'use client';

import * as React from 'react';
import {useEphemeralState} from '../../hooks/use-ephemeral-state.js';
import type {buy} from '../../server-actions/buy.js';

export interface BuyButtonProps {
  readonly buy: typeof buy;
}

export function BuyButton({buy}: BuyButtonProps): JSX.Element {
  const [quantity, setQuantity] = React.useState(1);
  const [isPending, startTransition] = React.useTransition();

  const [result, setResult] = useEphemeralState<Promise<React.ReactNode>>(
    undefined,
    3000,
  );

  const handleClick = () => {
    startTransition(() => setResult(buy(quantity)));
  };

  return (
    <div>
      <p className="my-2">
        This is a client component that triggers a server action, which in turn
        responds with serialized React element that's rendered below the button.
      </p>
      <input
        type="number"
        value={quantity}
        step={1}
        min={1}
        max={99}
        onChange={({target}) => setQuantity(parseInt(target.value, 10))}
        className="bg-zinc-100 p-1 outline-cyan-500"
      />
      {` `}
      <button
        onClick={handleClick}
        disabled={isPending}
        className="rounded-full bg-cyan-500 py-1 px-4 text-white disabled:bg-zinc-300"
        type="button"
      >
        Buy now
      </button>
      {/* Promises can now be rendered directly. */}
      {result as React.ReactNode}
    </div>
  );
}
