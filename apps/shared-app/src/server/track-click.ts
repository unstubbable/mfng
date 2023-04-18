'use server';

import 'server-only';

let clickCount = 0;

// eslint-disable-next-line @typescript-eslint/require-await
export async function trackClick(): Promise<void> {
  console.log(`Clicked ${++clickCount} times.`);
}
