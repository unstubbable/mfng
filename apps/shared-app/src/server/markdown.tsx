import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import 'server-only'; // We don't want react-markdown in client bundles.

export interface MarkdownProps {
  readonly text: string;
}

export function Markdown({text}: MarkdownProps): React.ReactNode {
  return (
    <ReactMarkdown
      components={{
        h1: ({children}) => (
          <h1 className="mb-4 text-3xl font-bold">{children}</h1>
        ),
        h2: ({children}) => (
          <h2 className="mb-4 text-2xl font-bold">{children}</h2>
        ),
        h3: ({children}) => (
          <h3 className="mb-4 text-xl font-bold">{children}</h3>
        ),
        h4: ({children}) => (
          <h4 className="mb-4 text-lg font-bold">{children}</h4>
        ),
        p: ({children}) => <p className="mb-3 last:mb-0">{children}</p>,
        li: ({children}) => (
          <li className="ml-4 list-item list-disc">{children}</li>
        ),
        pre: ({children}) => (
          <pre className="bg-zinc-100 p-2 text-xs">{children}</pre>
        ),
        a: ({href, children}) => (
          <a href={href} className="underline">
            {children}
          </a>
        ),
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
