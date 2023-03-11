'use server';

import {printInnerWidth} from '../client-functions/print-inner-width.js';

export interface BuyResult {
  readonly message: string;
  readonly printInnerWidth: () => void;
}

export async function buy(quantity: number): Promise<BuyResult> {
  const itemOrItems = quantity === 1 ? `item` : `items`;

  try {
    await new Promise((resolve, reject) =>
      setTimeout(Math.random() > 0.2 ? resolve : reject, 500),
    );

    return {message: `Bought ${quantity} ${itemOrItems}.`, printInnerWidth};
  } catch {
    throw new Error(`Could not buy ${quantity} ${itemOrItems}, try again.`);
  }
}
