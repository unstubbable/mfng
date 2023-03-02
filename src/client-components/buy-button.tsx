'use client';

import * as React from 'react';

export interface BuyButtonProps {
  readonly children: React.ReactNode;
  readonly buy: () => Promise<string>;
}

export function BuyButton({children, buy}: BuyButtonProps): JSX.Element {
  const handleClick = async () => {
    const result = await buy();

    console.log(result);
  };

  return <button onClick={handleClick}>{children}</button>;
}
