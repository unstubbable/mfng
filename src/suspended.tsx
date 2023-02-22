import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import 'server-only';

async function fetchContent(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return `This is a suspended component.`;
}

export async function Suspended(): Promise<JSX.Element> {
  const content = await fetchContent();

  return <ReactMarkdown>{content}</ReactMarkdown>;
}
