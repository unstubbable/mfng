'use server';

export async function buy(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return `bought`;
}
