import * as React from 'react';
import ReactMarkdown from 'react-markdown';

export interface MarkdownProps {
  readonly text: string;
}

export function Markdown({text}: MarkdownProps): React.ReactNode {
  return (
    <ReactMarkdown
      components={{
        h1: ({children}) => (
          <h1 className="my-4 text-3xl font-bold">{children}</h1>
        ),
        h2: ({children}) => (
          <h2 className="my-4 text-2xl font-bold">{children}</h2>
        ),
        h3: ({children}) => (
          <h3 className="my-4 text-xl font-bold">{children}</h3>
        ),
        li: ({children}) => (
          <li className="mx-4 list-item list-disc">{children}</li>
        ),
        pre: ({children}) => (
          <pre className="bg-zinc-100 p-2 text-xs">{children}</pre>
        ),
        a: (props) => <a {...props} className="underline" />,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
