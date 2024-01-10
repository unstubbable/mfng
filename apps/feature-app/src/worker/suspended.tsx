import * as React from 'react';

async function fetchContent(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  return `Hello from a Feature App!`;
}

export async function Suspended(): Promise<JSX.Element> {
  const content = await fetchContent();

  return <strong>{content}</strong>;
}
