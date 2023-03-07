import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import {wait} from './wait.js';
// import 'server-only'; // https://twitter.com/unstubbable/status/1630897868155305984

// Imagine this being a fetch that can only be executed from the server.
async function fetchSubject(): Promise<string> {
  await wait(300);

  return `world`;
}

export async function Hello(): Promise<JSX.Element> {
  const subject = await fetchSubject();

  return <ReactMarkdown>{`# Hello, *${subject}*!`}</ReactMarkdown>;
}
