import * as React from 'react';
import {ClientComponentWithServerAction} from './client-component-with-server-action.js';
import {serverFunctionPassedFromServer} from './server-function-passed-from-server.js';

function Main() {
  return React.createElement(ClientComponentWithServerAction, {
    action: serverFunctionPassedFromServer,
  });
}

export function pretendRscRendering() {
  console.log(React.createElement(Main));
}
