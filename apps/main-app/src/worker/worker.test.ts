import path from 'path';
import url from 'url';
import {jest} from '@jest/globals';
import type {UnstableDevWorker} from 'wrangler';
import {unstable_dev} from 'wrangler';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

describe(`worker`, () => {
  let worker: UnstableDevWorker;

  jest.setTimeout(30000);

  beforeAll(async () => {
    worker = await unstable_dev(
      path.resolve(currentDirname, `../../dist/worker.js`),
      {
        config: path.resolve(currentDirname, `./wrangler.toml`),
        experimental: {disableExperimentalWarning: true},
      },
    );
  });

  afterAll(async () => {
    await worker.stop();
  });

  it(`responds with html`, async () => {
    const resp = await worker.fetch();
    const text = await resp.text();

    expect(text).toMatch(
      `<p class="my-3">This is a suspended server component.</p>`,
    );
  });
});
