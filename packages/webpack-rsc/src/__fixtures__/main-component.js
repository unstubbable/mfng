import * as React from 'react';
import {ClientComponentWithServerAction} from './client-component-with-server-action.js';
import {serverFunctionPassedFromServer} from './server-function-passed-from-server.js';

async function serverFunctionWithInlineDirective() {
  'use server';

  return Promise.resolve(`server-function-with-inline-directive`);
}

export function Main() {
  return React.createElement(ClientComponentWithServerAction, {
    action1: serverFunctionPassedFromServer,
    action2: serverFunctionWithInlineDirective,
  });
}
