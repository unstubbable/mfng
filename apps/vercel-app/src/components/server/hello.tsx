import * as React from 'react';
import 'server-only';
import {Markdown} from './markdown.js';

// Imagine this being a fetch that can only be executed from the server.
async function fetchRuntimeName(): Promise<string> {
  return Promise.resolve(`Vercel Edge Function`);
}

export async function Hello(): Promise<JSX.Element> {
  const runtimeName = await fetchRuntimeName();

  return <Markdown text={`# Hello from a *${runtimeName}*!`} />;
}
