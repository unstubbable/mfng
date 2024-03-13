import * as React from 'react';
import {AI} from './ai.js';
import {Chat} from './chat.js';
import {Header} from './header.js';
import {Welcome} from './welcome.js';

export function App(): JSX.Element {
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>AI SDK with Generative UI on AWS</title>
        <link rel="icon" href="/client/favicon.ico" type="image/x-icon" />
      </head>
      <body className="bg-zinc-100">
        <Header />
        <main className="p-4">
          <AI>
            <Chat>
              <Welcome />
            </Chat>
          </AI>
        </main>
      </body>
    </html>
  );
}
