'use client';

import * as React from 'react';
import {useEphemeralState} from '../../hooks/use-ephemeral-state.js';
import type {buy} from '../../server-actions/buy.js';

export interface BuyButtonProps {
  readonly buy: typeof buy;
}

interface Result {
  readonly status: 'success' | 'error';
  readonly message: string;
}

export function BuyButton({buy}: BuyButtonProps): JSX.Element {
  const [quantity, setQuantity] = React.useState(1);
  const [isPending, setIsPending] = React.useState(false);
  const [result, setResult] = useEphemeralState<Result>(undefined, 3000);

  const handleClick = async () => {
    setIsPending(true);

    try {
      setResult({status: `success`, message: await buy(quantity)});
    } catch (error) {
      setResult({
        status: `error`,
        message: isErrorWithDigest(error) ? error.digest : `Unknown Error`,
      });
    } finally {
      setIsPending(false);
    }
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
      {result && (
        <p
          style={{
            color: result.status === `success` ? `forestgreen` : `orangered`,
          }}
        >
          {result.message}
        </p>
      )}
    </div>
  );
}

function isErrorWithDigest(error: unknown): error is Error & {digest: string} {
  return error instanceof Error && `digest` in error;
}
