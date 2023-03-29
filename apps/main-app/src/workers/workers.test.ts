import path from 'path';
import url from 'url';
import {jest} from '@jest/globals';
import type {UnstableDevWorker} from 'wrangler';
import {unstable_dev} from 'wrangler';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

describe(`main worker`, () => {
  let rscWorker: UnstableDevWorker;
  let mainWorker: UnstableDevWorker;

  jest.setTimeout(30000);

  beforeAll(async () => {
    rscWorker = await unstable_dev(
      path.resolve(currentDirname, `../../dist/rsc-worker.js`),
      {
        config: path.resolve(currentDirname, `./rsc/wrangler.toml`),
        experimental: {disableExperimentalWarning: true},
      },
    );

    mainWorker = await unstable_dev(
      path.resolve(currentDirname, `../../dist/main-worker.js`),
      {
        config: path.resolve(currentDirname, `./main/wrangler.toml`),
        experimental: {disableExperimentalWarning: true},
      },
    );
  });

  afterAll(async () => {
    await Promise.all([rscWorker.stop(), mainWorker.stop()]);
  });

  it(`responds with html`, async () => {
    const resp = await mainWorker.fetch();
    const text = await resp.text();

    expect(text).toMatch(
      `<p class="my-3">This is a suspended server component.</p>`,
    );
  });
});
