'use client';

import {clsx} from 'clsx';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import type {BuyResult} from '../server/buy.js';
import {Notification} from '../shared/notification.js';
import {Button} from './button.js';

export interface ProductProps {
  readonly buy: (
    prevResult: BuyResult | undefined,
    formData: FormData,
  ) => Promise<BuyResult>;
}

export function Product({buy}: ProductProps): JSX.Element {
  const [formState, formAction] = ReactDOM.useFormState(buy, undefined);
  const [result, setOptimisticResult] = React.useOptimistic(formState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        const formData = new FormData(event.currentTarget);

        React.startTransition(() => {
          setOptimisticResult((prevResult) => {
            const quantity = parseInt(formData.get(`quantity`) as string, 10);

            return {
              status: `success`,
              quantity,
              totalQuantityInSession:
                prevResult?.totalQuantityInSession ?? 0 + quantity,
            };
          });
        });
      }}
    >
      <p className="my-2">
        This is a client component that renders a form with a form action. On
        submit, a server action is called with the current form data, which in
        turn responds with a success or error result.
      </p>
      <p className="my-2">
        The form submission also works before hydration, including server-side
        rendering of the result! This can be simulated by blocking the
        javascript files.
      </p>
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
      {` `}
      <Button>Buy now</Button>
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
