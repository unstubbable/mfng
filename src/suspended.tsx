import * as React from 'react';
import ReactMarkdown from 'react-markdown';
// import 'server-only'; // https://twitter.com/unstubbable/status/1630897868155305984

async function fetchContent(): Promise<string> {
  await new Promise((resolve) => setTimeout(resolve, 1500));

  return `This is a suspended server component.`;
}

export async function Suspended(): Promise<JSX.Element> {
  const content = await fetchContent();

  return <ReactMarkdown>{content}</ReactMarkdown>;
}
