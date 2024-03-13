import {Markdown} from '@mfng/shared-app/markdown.js';
import * as React from 'react';
import {Link} from './link.js';

const welcomeText = `
This is a demo of a chat assistent that's capable of showing images of various
kinds.

The demo is built with [MFNG](https://github.com/unstubbable/mfng/), a minimal
React server components bundler/library, and the
[Vercel AI SDK](https://sdk.vercel.ai/docs).

It uses React Server Components to combine text with
[UI generated as output of the LLM](https://vercel.com/blog/ai-sdk-3-generative-ui).

Since it's not built with Next.js, it can be deployed almost anywhere. In this
case, it's deployed to AWS Lambda & CloudFront.

Try an example:
`;

const examplePrompts = [
  `Pick a painter from the 18th century and show me some of their work.`,
  `Find some of the earliest photographs.`,
  `What are those funny-looking, furless cats called?`,
];

export function Welcome(): React.ReactNode {
  return (
    <div className="rounded-lg bg-white p-4 shadow md:p-6">
      <h3 className="mb-4 text-lg font-bold leading-6">
        Welcome to the MFNG AI SDK Generative UI demo!
      </h3>
      <Markdown text={welcomeText} />
      <ul className="space-y-3">
        {examplePrompts.map((examplePrompt) => (
          <li className="ml-4 list-item list-disc">
            <Link pathname={`/?prompt=${encodeURIComponent(examplePrompt)}`}>
              {examplePrompt}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
