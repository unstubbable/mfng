import * as React from 'react';

async function fetchSubject(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return `world`;
}

export async function Hello(): Promise<JSX.Element> {
  const subject = await fetchSubject();

  return <div>Hello, {subject}!</div>;
}
