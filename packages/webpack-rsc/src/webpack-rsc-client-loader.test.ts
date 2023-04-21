import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import {jest} from '@jest/globals';
import type webpack from 'webpack';
import type {
  ServerReferencesMap,
  WebpackRscClientLoaderOptions,
} from './webpack-rsc-client-loader.cjs';
import webpackRscClientLoader from './webpack-rsc-client-loader.cjs';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

async function callLoader(
  resourcePath: string,
  options: WebpackRscClientLoaderOptions,
  emitError?: jest.Mock<(error: Error) => void>,
): Promise<string | Buffer> {
  const input = await fs.readFile(resourcePath);

  return new Promise((resolve, reject) => {
    const context: Partial<
      webpack.LoaderContext<WebpackRscClientLoaderOptions>
    > = {
      getOptions: () => options,
      resourcePath,
      cacheable: jest.fn(),
      emitError,
      callback: (error, content) => {
        if (error) {
          reject(error);
        } else if (content !== undefined) {
          resolve(content);
        } else {
          reject(
            new Error(
              `Did not receive any content from webpackRscClientLoader.`,
            ),
          );
        }
      },
    };

    void webpackRscClientLoader.default.call(
      context as webpack.LoaderContext<WebpackRscClientLoaderOptions>,
      input.toString(`utf-8`),
    );
  });
}

describe(`webpackRscClientLoader`, () => {
  test(`generates a server reference module based on given serverReferencesMap`, async () => {
    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/server-function.js`,
    );

    const serverReferencesMap: ServerReferencesMap = new Map([
      [resourcePath, {moduleId: `test`, exportNames: [`foo`, `bar`]}],
    ]);

    const output = await callLoader(resourcePath, {serverReferencesMap});

    expect(output).toEqual(
      `
import { createServerReference } from "react-server-dom-webpack/client";
import { callServer } from "@mfng/core/client";
export const foo = createServerReference("test#foo", callServer);
export const bar = createServerReference("test#bar", callServer);
`.trim(),
    );
  });

  test(`accepts a custom callServer import source`, async () => {
    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/server-function.js`,
    );

    const serverReferencesMap: ServerReferencesMap = new Map([
      [resourcePath, {moduleId: `test`, exportNames: [`foo`]}],
    ]);

    const callServerImportSource = `some-router/call-server`;

    const output = await callLoader(resourcePath, {
      serverReferencesMap,
      callServerImportSource,
    });

    expect(output).toEqual(
      `
import { createServerReference } from "react-server-dom-webpack/client";
import { callServer } from "some-router/call-server";
export const foo = createServerReference("test#foo", callServer);
`.trim(),
    );
  });

  test(`emits an error if module info is missing in serverReferencesMap`, async () => {
    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/server-function.js`,
    );

    const serverReferencesMap: ServerReferencesMap = new Map();
    const emitError = jest.fn();

    const output = await callLoader(
      resourcePath,
      {serverReferencesMap},
      emitError,
    );

    expect(emitError.mock.calls).toEqual([
      [
        new Error(
          `Could not find server references module info in \`serverReferencesMap\` for ${resourcePath}.`,
        ),
      ],
    ]);

    expect(output).toEqual(``);
  });

  test(`does not change modules without a 'use server' directive`, async () => {
    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/client-component.js`,
    );

    const serverReferencesMap = new Map();
    const output = await callLoader(resourcePath, {serverReferencesMap});

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
