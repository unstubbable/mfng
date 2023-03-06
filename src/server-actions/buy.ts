'use server';

export async function buy(quantity: number): Promise<string> {
  const itemOrItems = quantity === 1 ? `item` : `items`;

  try {
    await new Promise((resolve, reject) =>
      setTimeout(Math.random() > 0.5 ? resolve : reject, 500),
    );

    return `Bought ${quantity} ${itemOrItems}.`;
  } catch {
    throw new Error(`Could not buy ${quantity} ${itemOrItems}, try again.`);
  }
}
