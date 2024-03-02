import * as React from 'react';
import 'server-only';
import {Markdown} from './markdown.js';
import {wait} from './wait.js';

async function fetchContent(): Promise<string> {
  await wait(1500);

  return `This is a suspended server component.`;
}

export async function Suspended(): Promise<React.ReactElement> {
  const content = await fetchContent();

  return <Markdown text={content} />;
}
