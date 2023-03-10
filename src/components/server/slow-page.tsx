import * as React from 'react';
import {Main} from '../shared/main.js';
import {Markdown} from './markdown.js';
import content from './slow-page-content.md';
import {wait} from './wait.js';

export async function SlowPage(): Promise<JSX.Element> {
  await wait(3000);

  return (
    <Main>
      <Markdown text={content} />
    </Main>
  );
}
