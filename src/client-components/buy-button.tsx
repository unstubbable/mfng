'use client';

import * as React from 'react';

export interface BuyButtonProps {
  readonly children: React.ReactNode;
  readonly buy: () => Promise<string>;
}

export function BuyButton({children, buy}: BuyButtonProps): JSX.Element {
  const [isPending, setIsPending] = React.useState(false);

  const handleClick = async () => {
    setIsPending(true);
    const result = await buy();
    setIsPending(false);
    console.log(result);
  };

  return (
    <div>
      <p>This is a client component that triggers a server action.</p>
      <button onClick={handleClick} disabled={isPending}>
        {children}
      </button>
    </div>
  );
}
