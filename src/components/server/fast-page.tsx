import * as React from 'react';
import {Main} from '../shared/main.js';
import content from './fast-page-content.md';
import {Markdown} from './markdown.js';

export function FastPage(): JSX.Element {
  return (
    <Main>
      <Markdown text={content} />
    </Main>
  );
}
