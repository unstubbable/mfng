import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import {Link} from '../client/link.js';
import content from './another-page.md';

export function AnotherPage(): JSX.Element {
  return (
    <main>
      <ReactMarkdown>{content}</ReactMarkdown>
      <p>
        <Link pathname="/">Back to home page</Link>
      </p>
    </main>
  );
}
