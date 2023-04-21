import {Router} from '@mfng/core/client/browser';
import {Analytics} from '@vercel/analytics/react';
import * as React from 'react';
import ReactDOMClient from 'react-dom/client';
// eslint-disable-next-line import/no-extraneous-dependencies
import 'tailwindcss/tailwind.css';
import {reportWebVitals} from './vitals.js';

React.startTransition(() => {
  ReactDOMClient.hydrateRoot(
    document,
    <React.StrictMode>
      <Router />
      <Analytics />
    </React.StrictMode>,
  );

  reportWebVitals();
});
