import {Markdown} from '@mfng/shared-app/markdown.js';
import * as React from 'react';

const welcomeText = `
This is a demo of a chat assistent that's capable of showing images of various
kinds.

The demo is built with [MFNG](https://github.com/unstubbable/mfng/), a minimal
React server components bundler/library, and the
[Vercel AI SDK](https://sdk.vercel.ai/docs).

It uses React Server Components to combine text with
[UI generated as output of the LLM](https://vercel.com/blog/ai-sdk-3-generative-ui).

The app is deployed to AWS Lambda & CloudFront, and protected by a web
application firewall. For cost reasons, it's heavily rate-limited, so you might
see error responses.

Try an example:
`;

const examplePrompts = [
  `Pick a painter from the 18th century and show me some of their work.`,
  `List some of the earliest photographs.`,
  `What are those funny-looking, furless cats called?`,
];

export function Welcome(): React.ReactNode {
  return (
    <div className="rounded-lg bg-white p-4 text-zinc-500 shadow md:p-6">
      <h3 className="mb-4 text-lg font-bold leading-6 text-black">
        Welcome to the MFNG AI SDK Generative UI demo!
      </h3>
      <Markdown text={welcomeText} />
      <ul className="space-y-3">
        {examplePrompts.map((prompt) => (
          <li key={prompt} className="ml-4 list-item list-disc">
            <button className="text-left">
              <span className="text-black underline">{prompt}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
