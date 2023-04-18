'use client';

import * as React from 'react';
import {ClientComponentWithServerAction} from './client-component-with-server-action.js';

export function ComponentA() {
  return React.createElement(`div`);
}

export const ComponentB = function () {
  return React.createElement(`div`);
};

export const ComponentC = () => {
  return React.createElement(ClientComponentWithServerAction);
};
