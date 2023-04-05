import * as React from 'react';
import 'server-only';
import {Markdown} from './markdown.js';

// Imagine this being a fetch that can only be executed from the server.
async function fetchSubject(): Promise<string> {
  return Promise.resolve(`world`);
}

export async function Hello(): Promise<JSX.Element> {
  const subject = await fetchSubject();

  return <Markdown text={`# Hello, *${subject}*!`} />;
}
