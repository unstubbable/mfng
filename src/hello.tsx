import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import 'server-only';

// Imagine this being a fetch that can only be executed from the server.
async function fetchSubject(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 300));

  return `world`;
}

export async function Hello(): Promise<JSX.Element> {
  const subject = await fetchSubject();

  return <ReactMarkdown>{`# Hello, *${subject}*!`}</ReactMarkdown>;
}
