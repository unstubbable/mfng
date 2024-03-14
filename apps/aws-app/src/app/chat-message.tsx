import {clsx} from 'clsx';
import * as React from 'react';

export type ChatMessageProps = React.PropsWithChildren<{
  readonly role: 'assistant' | 'user' | 'error';
}>;

export function ChatMessage({
  children,
  role,
}: ChatMessageProps): React.ReactNode {
  return (
    <div
      className={clsx(`max-w-lg rounded-md px-4 py-3 shadow`, {
        'ml-8 self-end bg-white': role === `user`,
        'mr-8 bg-zinc-800 text-white': role === `assistant`,
        'mr-8 border-2 border-red-700 border-opacity-70 bg-red-100 text-black':
          role === `error`,
      })}
    >
      {children}
    </div>
  );
}
