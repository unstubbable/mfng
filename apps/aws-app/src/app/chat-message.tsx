import {clsx} from 'clsx';
import * as React from 'react';

export type ChatMessageProps = React.PropsWithChildren<{
  readonly role: 'assistant' | 'user';
}>;

export function ChatMessage({
  children,
  role,
}: ChatMessageProps): React.ReactNode {
  return (
    <div
      className={clsx(`max-w-lg rounded-md p-4 shadow`, {
        'ml-8 self-end bg-white': role === `user`,
        'mr-8 bg-zinc-800 text-white': role === `assistant`,
      })}
    >
      {children}
    </div>
  );
}
