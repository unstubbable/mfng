'use server';

import 'server-only';

let clickCount = 0;

// eslint-disable-next-line @typescript-eslint/require-await
export async function trackClick(): Promise<number> {
  clickCount++;

  console.log(`Clicked ${clickCount} ${clickCount === 1 ? `time` : `times`}.`);

  return clickCount;
}
