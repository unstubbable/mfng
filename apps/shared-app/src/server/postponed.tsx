import {usePostpone} from '@mfng/core/server/rsc';
import * as React from 'react';
import 'server-only';
import {Markdown} from './markdown.js';
import {wait} from './wait.js';

async function fetchContent(): Promise<string> {
  await wait(1500);

  return `This is a postponed server component.`;
}

export async function Postponed(): Promise<React.ReactElement> {
  usePostpone();

  const content = await fetchContent();

  return <Markdown text={content} />;
}
