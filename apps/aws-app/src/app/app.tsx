import * as React from 'react';
import {AI} from './ai.js';
import {Chat} from './chat.js';

export function App(): JSX.Element {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AI SDK with Generative UI on AWS</title>
        <link rel="icon" href="/client/favicon.ico" type="image/x-icon" />
      </head>
      <body className="m-3">
        <h1 className="my-2 text-2xl font-bold">
          AI SDK with Generative UI on AWS
        </h1>
        <AI>
          <Chat />
        </AI>
      </body>
    </html>
  );
}
