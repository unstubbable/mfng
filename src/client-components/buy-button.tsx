'use client';

import * as React from 'react';
import type {buy} from '../server-actions/buy.js';
import {useEphemeralState} from './use-ephemeral-state.js';

export interface BuyButtonProps {
  readonly buy: typeof buy;
}

export function BuyButton({buy}: BuyButtonProps): JSX.Element {
  const [quantity, setQuantity] = React.useState(1);
  const [isPending, setIsPending] = React.useState(false);
  const [result, setResult] = useEphemeralState<string>(undefined, 3000);

  const handleClick = async () => {
    setIsPending(true);
    setResult(await buy(quantity));
    setIsPending(false);
  };

  return (
    <div>
      <p>This is a client component that triggers a server action.</p>
      <input
        type="number"
        value={quantity}
        step={1}
        min={1}
        max={99}
        onChange={({target}) => setQuantity(parseInt(target.value, 10))}
      />
      {` `}
      <button onClick={handleClick} disabled={isPending}>
        Buy now
      </button>
      {result && <p style={{color: `forestgreen`}}>{result}</p>}
    </div>
  );
}
