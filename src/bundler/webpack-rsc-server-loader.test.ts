import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import type webpack from 'webpack';
import webpackRscServerLoader from './webpack-rsc-server-loader.js';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

async function callLoader(input: string): Promise<string | Buffer> {
  return new Promise((resolve, reject) => {
    const context: Partial<webpack.LoaderContext<{}>> = {
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

    const result = webpackRscServerLoader.call(
      context as webpack.LoaderContext<{}>,
      input,
    );

    if (result) {
      reject(
        new Error(
          `Expected webpackRscServerLoader to return void, received ${result} instead.`,
        ),
      );
    }
  });
}

describe.only(`webpackRscServerLoader`, () => {
  test(`keeps only the 'use client' directive, and exported functions that are transformed to client references`, async () => {
    const input = await fs.readFile(
      path.resolve(currentDirname, `__fixtures__/client-components.js`),
    );

    const output = await callLoader(input.toString(`utf-8`));

    expect(output).toEqual(
      `
'use client';

export const ComponentA = {
  $$type: Symbol.for("react.client.reference"),
  $$id: eval("'ComponentA'")
};
export const ComponentB = {
  $$type: Symbol.for("react.client.reference"),
  $$id: eval("'ComponentB'")
};
export const ComponentC = {
  $$type: Symbol.for("react.client.reference"),
  $$id: eval("'ComponentC'")
};
`.trim(),
    );
  });

  test(`does not change modules without a 'use client' directive`, async () => {
    const input = await fs.readFile(
      path.resolve(currentDirname, `__fixtures__/server-component.js`),
    );

    const output = await callLoader(input.toString(`utf-8`));

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
