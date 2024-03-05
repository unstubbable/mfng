import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import {jest} from '@jest/globals';
import type webpack from 'webpack';
import type {
  ClientReferencesMap,
  ServerReferencesMap,
  WebpackRscServerLoaderOptions,
} from './webpack-rsc-server-loader.cjs';
import webpackRscServerLoader from './webpack-rsc-server-loader.cjs';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

async function callLoader(
  resourcePath: string,
  clientReferencesMap: ClientReferencesMap,
  serverReferencesMap: ServerReferencesMap,
): Promise<string | Buffer> {
  const input = await fs.readFile(resourcePath);

  return new Promise((resolve, reject) => {
    const context: Partial<
      webpack.LoaderContext<WebpackRscServerLoaderOptions>
    > = {
      getOptions: () => ({clientReferencesMap, serverReferencesMap}),
      resourcePath,
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

    void webpackRscServerLoader.call(
      context as webpack.LoaderContext<WebpackRscServerLoaderOptions>,
      input.toString(`utf-8`),
    );
  });
}

describe(`webpackRscServerLoader`, () => {
  test(`keeps only the 'use client' directive, and exported functions that are transformed to client references`, async () => {
    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/client-components.js`,
    );

    const output = await callLoader(resourcePath, new Map(), new Map());
    const idPrefix = path.relative(process.cwd(), resourcePath);

    expect(output).toEqual(
      `
'use client';

import { registerClientReference } from "react-server-dom-webpack/server";
function createClientReferenceProxy(exportName) {
  return () => {
    throw new Error(\`Attempted to call \${exportName}() from the server but \${exportName} is on the client. It's not possible to invoke a client function from the server, it can only be rendered as a Component or passed to props of a Client Component.\`);
  };
}
export const ComponentA = registerClientReference(createClientReferenceProxy("ComponentA"), "${idPrefix}#ComponentA", "ComponentA");
export const ComponentB = registerClientReference(createClientReferenceProxy("ComponentB"), "${idPrefix}#ComponentB", "ComponentB");
export const ComponentC = registerClientReference(createClientReferenceProxy("ComponentC"), "${idPrefix}#ComponentC", "ComponentC");
export const ComponentF = registerClientReference(createClientReferenceProxy("ComponentF"), "${idPrefix}#ComponentF", "ComponentF");
export const ComponentD = registerClientReference(createClientReferenceProxy("ComponentD"), "${idPrefix}#ComponentD", "ComponentD");
export const ComponentE = registerClientReference(createClientReferenceProxy("ComponentE"), "${idPrefix}#ComponentE", "ComponentE");
`.trim(),
    );
  });

  test(`populates the given client references map`, async () => {
    const clientReferencesMap: ClientReferencesMap = new Map();

    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/client-components.js`,
    );

    await callLoader(resourcePath, clientReferencesMap, new Map());

    expect(Object.fromEntries(clientReferencesMap.entries())).toEqual({
      [resourcePath]: [
        {
          exportName: `ComponentA`,
          id: `src/__fixtures__/client-components.js#ComponentA`,
        },
        {
          exportName: `ComponentB`,
          id: `src/__fixtures__/client-components.js#ComponentB`,
        },
        {
          exportName: `ComponentC`,
          id: `src/__fixtures__/client-components.js#ComponentC`,
        },
        {
          exportName: `ComponentF`,
          id: `src/__fixtures__/client-components.js#ComponentF`,
        },
        {
          exportName: `ComponentD`,
          id: `src/__fixtures__/client-components.js#ComponentD`,
        },
        {
          exportName: `ComponentE`,
          id: `src/__fixtures__/client-components.js#ComponentE`,
        },
      ],
    });
  });

  test(`adds 'registerServerReference' calls to all exported functions of a module with a 'use server' directive`, async () => {
    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/server-functions.js`,
    );

    const output = await callLoader(resourcePath, new Map(), new Map());

    expect(output).toEqual(
      `
'use server';

import { registerServerReference } from "react-server-dom-webpack/server";
export async function foo() {
  return Promise.resolve(\`foo\`);
}
registerServerReference(foo, module.id, "foo");
export const bar = async () => Promise.resolve(\`bar\`);
registerServerReference(bar, module.id, "bar");
export const baz = function () {
  quux();
};
registerServerReference(baz, module.id, "baz");
export const qux = 42;
function quux() {}
`.trim(),
    );
  });

  test(`adds 'registerServerReference' calls to all functions that have a 'use server' directive`, async () => {
    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/server-functions-inline-directive.js`,
    );

    const output = await callLoader(resourcePath, new Map(), new Map());

    expect(output).toEqual(
      `
import { registerServerReference } from "react-server-dom-webpack/server";
export async function foo() {
  'use server';

  return \`foo\`;
}
registerServerReference(foo, module.id, "foo");
export async function bar() {
  return qux();
}
const b = () => {
  'use server';

  return \`baz\`;
};
registerServerReference(b, module.id, "baz");
export { b as baz };
async function qux() {
  'use server';

  return \`qux\`;
}
registerServerReference(qux, module.id, "qux");
export { qux };
`.trim(),
    );
  });

  test(`populates the given server references map`, async () => {
    const serverReferencesMap: ServerReferencesMap = new Map();

    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/server-functions.js`,
    );

    await callLoader(resourcePath, new Map(), serverReferencesMap);

    expect(Object.fromEntries(serverReferencesMap.entries())).toEqual({
      [resourcePath]: {exportNames: [`foo`, `bar`, `baz`]},
    });
  });

  test(`does not change modules without a 'use client' or 'use server' directive`, async () => {
    const resourcePath = path.resolve(
      currentDirname,
      `__fixtures__/server-component.js`,
    );

    const source = (await fs.readFile(resourcePath)).toString();
    const output = await callLoader(resourcePath, new Map(), new Map());

    expect(output).toEqual(source);
  });
});
