'use client';

import {useActions, useUIState} from 'ai/rsc';
import {clsx} from 'clsx';
import * as React from 'react';
import type {AI} from './ai.js';

export function Chat(): React.ReactNode {
  const [inputValue, setInputValue] = React.useState(``);
  const [messages, setMessages] = useUIState<typeof AI>();
  const {submitUserMessage} = useActions<typeof AI>();

  return (
    <div className="space-y-3 pb-16">
      {messages.map((message) => (
        <div
          key={message.id}
          className={clsx(`rounded-md p-2`, {
            'ml-8 bg-zinc-200': message.role === `user`,
            'mr-8 bg-zinc-700 text-white': message.role === `assistant`,
          })}
        >
          {message.display}
        </div>
      ))}

      <form
        className="fixed bottom-0 left-0 right-0 flex w-full border-t bg-zinc-50 p-3"
        onSubmit={async (event) => {
          event.preventDefault();

          setMessages((prevMessages) => [
            ...prevMessages,
            {id: Date.now(), role: `user`, display: <div>{inputValue}</div>},
          ]);

          const message = await submitUserMessage(inputValue);

          setMessages((prevMessages) => [...prevMessages, message]);
          setInputValue(``);
        }}
      >
        <input
          className="flex-1 rounded-sm bg-zinc-200 p-2 outline-cyan-500"
          placeholder="Send a message."
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
          }}
        />
      </form>
    </div>
  );
}
