'use server';

export async function buy(quantity: number): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return `Bought ${quantity} ${quantity === 1 ? `item` : `items`}.`;
}
