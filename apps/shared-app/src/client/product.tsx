'use client';

import {clsx} from 'clsx';
import * as React from 'react';
import type {buy} from '../server/buy.js';
import {Button} from './button.js';
import {useEphemeralState} from './use-ephemeral-state.js';

export interface ProductProps {
  readonly buy: typeof buy;
}

export function Product({buy}: ProductProps): JSX.Element {
  const [isPending, startTransition] = React.useTransition();

  const [result, setResult] = useEphemeralState<ReturnType<typeof buy>>(
    undefined,
    5000,
  );

  const [message, fieldErrors] = result ? React.use(result) : [];

  const formAction = (formData: FormData) => {
    startTransition(() => setResult(buy(formData)));
  };

  return (
    <form action={formAction}>
      <p className="my-2">
        This is a client component that renders a form with a form action. On
        submit, the form action calls a server action with the current form
        data, which in turn responds with a serialized React element that's
        rendered below the button.
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
          fieldErrors?.quantity
            ? [`bg-red-100`, `outline-red-700`]
            : [`bg-zinc-100`, `outline-cyan-500`],
        )}
      />
      {` `}
      <Button disabled={isPending}>Buy now</Button>
      {message}
    </form>
  );
}
