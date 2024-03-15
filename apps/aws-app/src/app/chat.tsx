'use client';

import {useActions, useUIState} from 'ai/rsc';
import * as React from 'react';
import Textarea from 'react-textarea-autosize';
import type {AI} from './ai.js';
import {ChatMessage} from './chat-message.js';
import {getErrorMessage} from './get-error-message.js';
import {useEnterSubmit} from './use-enter-submit.js';

export function Chat({children}: React.PropsWithChildren): React.ReactNode {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [inputValue, setInputValue] = React.useState(``);
  const [isPending, startTransition] = React.useTransition();
  const [messages, setMessages] = useUIState<typeof AI>();
  const {submitUserMessage} = useActions<typeof AI>();
  const {formRef, handleKeyDown} = useEnterSubmit();

  const formAction = (formData: FormData) => {
    const examplePrompt = formData.get(`example-prompt`)?.toString();

    if (examplePrompt && textareaRef.current) {
      setInputValue(examplePrompt);
    }

    const userInput = examplePrompt ?? inputValue;

    if (!userInput || isPending) {
      return;
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      {id: Date.now(), role: `user`, display: <div>{userInput}</div>},
    ]);

    startTransition(async () => {
      try {
        const message = await submitUserMessage(userInput);

        setMessages((prevMessages) => [...prevMessages, message]);
        setInputValue(``);
      } catch (error) {
        console.error(error);
        const errorMessage = getErrorMessage(error);

        setMessages((prevMessages) => [
          ...prevMessages.slice(0, -1),
          {id: Date.now(), role: `error`, display: <p>{errorMessage}</p>},
        ]);
      }

      textareaRef.current?.focus();
    });
  };

  return (
    <form
      ref={formRef}
      className="mx-auto flex max-w-3xl flex-col space-y-3 pb-20"
      action={formAction}
    >
      {messages.length === 0 && children}

      {messages.map((message) => (
        <ChatMessage key={message.id} role={message.role}>
          {message.display}
        </ChatMessage>
      ))}

      <div className="fixed bottom-0 left-0 right-0 w-full">
        <div className="mx-auto flex max-w-3xl border-t bg-white p-4 shadow-lg md:rounded-t-xl md:border md:p-6">
          <Textarea
            ref={textareaRef}
            className="flex-1 resize-none rounded-md bg-zinc-100 p-2 outline-cyan-500"
            placeholder="Send a message."
            rows={1}
            autoFocus
            maxRows={6}
            value={inputValue}
            onChange={(event) => {
              setInputValue(event.target.value);
            }}
            onKeyDown={handleKeyDown}
          />
        </div>
      </div>
    </form>
  );
}
