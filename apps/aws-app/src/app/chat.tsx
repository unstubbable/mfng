'use client';

import {useActions, useUIState} from 'ai/rsc';
import * as React from 'react';
import type {AI} from './ai.js';
import {ChatMessage} from './chat-message.js';

export function Chat(): React.ReactNode {
  const [inputValue, setInputValue] = React.useState(``);
  const [messages, setMessages] = useUIState<typeof AI>();
  const {submitUserMessage} = useActions<typeof AI>();

  return (
    <div className="space-y-3 pb-16">
      {messages.map((message) => (
        <ChatMessage key={message.id} role={message.role}>
          {message.display}
        </ChatMessage>
      ))}

      <form
        className="fixed bottom-0 left-0 right-0 flex w-full bg-white p-4 shadow"
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
          className="flex-1 rounded-sm bg-zinc-100 p-2 outline-cyan-500"
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
