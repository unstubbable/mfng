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
    <div className="space-y-3">
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
        className="flex"
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
          className=" flex-1 rounded-sm bg-zinc-100 p-1 outline-cyan-500"
          placeholder="Send a message..."
          value={inputValue}
          onChange={(event) => {
            setInputValue(event.target.value);
          }}
        />
      </form>
    </div>
  );
}
