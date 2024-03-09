import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import ReactServerDOMClient from 'react-server-dom-webpack/client.browser';

const Root = () => React.use(ReactServerDOMClient.createFromFetch(fetch(`/`)));

ReactDOM.hydrateRoot(
  document.getElementById(`main`),
  React.createElement(Root),
);
