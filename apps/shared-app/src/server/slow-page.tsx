import * as React from 'react';
import {Main} from '../shared/main.js';
import {Markdown} from './markdown.js';
import {wait} from './wait.js';

const content = `
# This is slow page.

Its content is written in a markdown document that's simulated to be fetched
from some kind of (slow) CMS. The content is _fetched and rendered on the
server_. There is no markdown library in the client bundle.
`;

export async function SlowPage(): Promise<React.ReactElement> {
  await wait(3000);

  return (
    <Main>
      <Markdown text={content} />
    </Main>
  );
}
