import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import content from './slow-page-content.md';
import {wait} from './wait.js';

export async function SlowPage(): Promise<JSX.Element> {
  await wait(3000);

  return (
    <main>
      <ReactMarkdown>{content}</ReactMarkdown>
    </main>
  );
}
