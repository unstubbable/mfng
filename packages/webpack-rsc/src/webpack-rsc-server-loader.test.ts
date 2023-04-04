import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import {jest} from '@jest/globals';
import type webpack from 'webpack';
import type {
  ClientReferencesMap,
  WebpackRscServerLoaderOptions,
} from './webpack-rsc-server-loader.cjs';
import webpackRscServerLoader from './webpack-rsc-server-loader.cjs';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

async function callLoader(
  filename: string,
  clientReferenceMap: ClientReferencesMap,
): Promise<string | Buffer> {
  const input = await fs.readFile(path.resolve(currentDirname, filename));

  return new Promise((resolve, reject) => {
    const context: Partial<
      webpack.LoaderContext<WebpackRscServerLoaderOptions>
    > = {
      getOptions: () => ({clientReferencesMap: clientReferenceMap}),
      resourcePath: path.resolve(currentDirname, filename),
      cacheable: jest.fn(),
      callback: (error, content) => {
        if (error) {
          reject(error);
        } else if (content) {
          resolve(content);
        } else {
          reject(
            new Error(
              `Did not receive any content from webpackRscServerLoader.`,
            ),
          );
        }
      },
    };

    void webpackRscServerLoader.default.call(
      context as webpack.LoaderContext<WebpackRscServerLoaderOptions>,
      input.toString(`utf-8`),
    );
  });
}

describe(`webpackRscServerLoader`, () => {
  test(`keeps only the 'use client' directive, and exported functions that are transformed to client references`, async () => {
    const clientReferenceMap: ClientReferencesMap = new Map();
    const filename = `__fixtures__/client-components.js`;
    const output = await callLoader(filename, clientReferenceMap);

    const idPrefix = path.relative(
      process.cwd(),
      path.resolve(currentDirname, filename),
    );

    expect(output).toEqual(
      `
'use client';

export const ComponentA = {
  $$typeof: Symbol.for("react.client.reference"),
  $$id: "${idPrefix}#ComponentA"
};
export const ComponentB = {
  $$typeof: Symbol.for("react.client.reference"),
  $$id: "${idPrefix}#ComponentB"
};
export const ComponentC = {
  $$typeof: Symbol.for("react.client.reference"),
  $$id: "${idPrefix}#ComponentC"
};
`.trim(),
    );
  });

  test(`does not change modules without a 'use client' directive`, async () => {
    const clientReferenceMap: ClientReferencesMap = new Map();
    const filename = `__fixtures__/server-component.js`;
    const output = await callLoader(filename, clientReferenceMap);

    expect(output).toEqual(
      `
import * as React from 'react';
export async function ServerComponent() {
  return React.createElement(\`div\`);
}
    `.trim(),
    );
  });
});
