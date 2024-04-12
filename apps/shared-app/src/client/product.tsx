'use client';

import {clsx} from 'clsx';
import * as React from 'react';
import type {BuyResult} from '../server/buy.js';
import {Notification} from '../shared/notification.js';
import {Button} from './button.js';

export interface ProductProps {
  readonly name: string;
  readonly buy: (
    prevResult: BuyResult | undefined,
    formData: FormData,
  ) => Promise<BuyResult>;
}

export function Product({name, buy}: ProductProps): React.ReactNode {
  const [formState, formAction] = React.useActionState(buy, undefined);

  const [result, setOptimisticResult] = React.useOptimistic<
    BuyResult | undefined,
    number
  >(formState, (prevResult, quantity) => ({
    status: `success`,
    quantity,
    totalQuantityInSession:
      (prevResult?.totalQuantityInSession ?? 0) + quantity,
  }));

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
    const formData = new FormData(event.currentTarget);
    event.preventDefault();

    React.startTransition(() => {
      setOptimisticResult(parseInt(formData.get(`quantity`) as string, 10));
      formAction(formData);
    });
  };

  return (
    <form
      action={formAction}
      onSubmit={handleSubmit}
      className="flex items-end gap-x-3"
    >
      <div className="space-y-2">
        <h3 className="font-semibold">{name}</h3>
        <div className="space-x-2">
          <input
            type="number"
            name="quantity"
            defaultValue={1}
            step={1}
            min={1}
            max={99}
            className={clsx(
              `p-1`,
              result?.status === `error` && result.fieldErrors?.quantity
                ? [`bg-red-100`, `outline-red-700`]
                : [`bg-zinc-100`, `outline-cyan-500`],
            )}
          />
          <Button>Buy now</Button>
        </div>
      </div>
      {result && (
        <Notification status={result.status}>
          {result.status === `success` ? (
            <p>
              Bought <strong>{result.quantity}</strong>
              {` `}
              {result.quantity === 1 ? `item` : `items`}.
            </p>
          ) : (
            <p>{result.message}</p>
          )}
          <p>
            Total items bought: <strong>{result.totalQuantityInSession}</strong>
          </p>
        </Notification>
      )}
    </form>
  );
}
