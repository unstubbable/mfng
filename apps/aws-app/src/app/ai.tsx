import {createAI} from 'ai/rsc';
import type * as React from 'react';
import {submitUserMessage} from './submit-user-message.js';

export type AIStateItem =
  | {
      readonly role: 'user' | 'assistant' | 'system';
      readonly content: string;
    }
  | {
      readonly role: 'function';
      readonly content: string;
      readonly name: string;
    };

export interface UIStateItem {
  readonly id: number;
  readonly role: 'user' | 'assistant' | 'error';
  readonly display: React.ReactNode;
}

const initialAIState: AIStateItem[] = [];
const initialUIState: UIStateItem[] = [];

export const AI = createAI({
  actions: {submitUserMessage},
  initialUIState,
  initialAIState,
});
