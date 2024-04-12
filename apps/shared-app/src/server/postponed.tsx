import * as React from 'react';
import 'server-only';
import {Markdown} from './markdown.js';
import {wait} from './wait.js';

async function fetchContent(): Promise<string> {
  await wait(1500);

  return `This is a postponed server component.`;
}

let count = 0;

export async function Postponed(): Promise<React.ReactElement> {
  if (count++ % 2 === 0) {
    React.unstable_postpone();
  }

  const content = await fetchContent();

  return <Markdown text={content} />;
}
