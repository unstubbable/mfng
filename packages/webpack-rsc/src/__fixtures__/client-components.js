'use client';

import * as React from 'react';
import {ClientComponentWithServerAction} from './client-component-with-server-action.js';

export function ComponentA() {
  return React.createElement(`div`);
}

export const ComponentB = function () {
  return React.createElement(`div`);
};

export const foo = 1;

export const ComponentC = () => {
  return React.createElement(ClientComponentWithServerAction);
};

const bar = 2;

const ComponentF = () => React.createElement(`div`);

export {D as ComponentD, bar, ComponentE, ComponentF};

function D() {
  return React.createElement(`div`);
}

function ComponentE() {
  return React.createElement(`div`);
}
