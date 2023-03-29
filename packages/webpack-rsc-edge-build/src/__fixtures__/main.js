import * as React from 'react';
import {serverFunction} from './server-function.js';

export function Main() {
  return React.createElement(`div`, {action: serverFunction});
}
