import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import {jest} from '@jest/globals';
import type webpack from 'webpack';
import type {ServerReferencesMap} from './webpack-rsc-server-loader.cjs';
import type {WebpackRscSsrLoaderOptions} from './webpack-rsc-ssr-loader.cjs';
import webpackRscSsrLoader from './webpack-rsc-ssr-loader.cjs';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

async function callLoader(
  resourcePath: string,
  serverReferencesMap: ServerReferencesMap,
): Promise<string | Buffer> {
  const input = await fs.readFile(resourcePath);

  return new Promise((resolve, reject) => {
    const context: Partial<webpack.LoaderContext<WebpackRscSsrLoaderOptions>> =
      {
        getOptions: () => ({serverReferencesMap}),
        resourcePath,
        cacheable: jest.fn(),
        callback: (error, content) => {
          if (error) {
            reject(error);
          } else if (content !== undefined) {
            resolve(content);
          } else {
            reject(
              new Error(
                `Did not receive any content from webpackRscSsrLoader.`,
              ),
            );
          }
        },
      };

    void webpackRscSsrLoader.call(
      context as webpack.LoaderContext<WebpackRscSsrLoaderOptions>,
      input.toString(`utf-8`),
    );
  });
}

describe(`webpackRscSsrLoader`, () => {
  test(`generates stubs for all function exports of a server reference module, and removes the rest`, async () => {
    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/server-functions.js`,
    );

    const output = await callLoader(resourcePath, new Map());

    expect(output).toEqual(
      `
'use server';

export function foo() {
  throw new Error("Server actions must not be called during server-side rendering.");
}
export function bar() {
  throw new Error("Server actions must not be called during server-side rendering.");
}
export function baz() {
  throw new Error("Server actions must not be called during server-side rendering.");
}
`.trim(),
    );
  });

  test(`populates the given server references map`, async () => {
    const serverReferencesMap: ServerReferencesMap = new Map();

    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/server-functions.js`,
    );

    await callLoader(resourcePath, serverReferencesMap);

    expect(Object.fromEntries(serverReferencesMap.entries())).toEqual({
      [resourcePath]: {exportNames: [`foo`, `bar`, `baz`]},
    });
  });

  test(`does not change modules without a 'use server' directive`, async () => {
    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/client-component.js`,
    );

    const output = await callLoader(resourcePath, new Map());

    expect(output.toString().trim()).toEqual(
      `
// @ts-nocheck
'use client';

import * as React from 'react';

export function ClientComponent({action}) {
  React.useEffect(() => {
    action().then(console.log);
  }, []);

  return null;
}`.trim(),
    );
  });
});
