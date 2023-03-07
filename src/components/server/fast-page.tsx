import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import content from './fast-page-content.md';

export function FastPage(): JSX.Element {
  return (
    <main>
      <ReactMarkdown>{content}</ReactMarkdown>
    </main>
  );
}
