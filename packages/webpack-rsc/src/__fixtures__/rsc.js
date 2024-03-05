import * as React from 'react';
import {Main} from './main-component.js';

export function pretendRscRendering() {
  console.log(React.createElement(Main));
}
