import {Router} from '@mfng/core/client/browser';
import * as React from 'react';
import ReactDOMClient from 'react-dom/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'tailwindcss/tailwind.css';

React.startTransition(() => {
  ReactDOMClient.hydrateRoot(
    document,
    <React.StrictMode>
      <Router />
    </React.StrictMode>,
  );
});
