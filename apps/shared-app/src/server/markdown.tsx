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
        p: ({children}) => <p className="my-3">{children}</p>,
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
