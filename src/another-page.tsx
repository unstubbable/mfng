import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import content from './another-page.md';
import {Link} from './client-components/link.js';

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
