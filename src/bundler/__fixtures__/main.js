import * as React from 'react';
import {ClientComponent} from './client-component.js';
import {serverFunction} from './server-function.js';

export function Main() {
  return React.createElement(ClientComponent, {action: serverFunction});
}
