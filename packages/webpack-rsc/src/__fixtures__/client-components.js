'use client';

import * as React from 'react';

export function ComponentA() {
  return React.createElement(`div`);
}

export const ComponentB = function () {
  return React.createElement(`div`);
};

export const ComponentC = () => {
  return React.createElement(`div`);
};
