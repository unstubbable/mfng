import type {UnstableDevWorker} from 'wrangler';
import {unstable_dev} from 'wrangler';

describe(`main worker`, () => {
  let rscWorker: UnstableDevWorker;
  let mainWorker: UnstableDevWorker;

  beforeAll(async () => {
    [rscWorker, mainWorker] = await Promise.all([
      unstable_dev(`dist/rsc-worker.js`, {
        config: `src/workers/rsc/wrangler.toml`,
        experimental: {disableExperimentalWarning: true},
      }),
      unstable_dev(`dist/main-worker.js`, {
        config: `src/workers/main/wrangler.toml`,
        experimental: {disableExperimentalWarning: true},
      }),
    ]);
  });

  afterAll(async () => {
    await Promise.all([rscWorker.stop(), mainWorker.stop()]);
  });

  it(`responds with html`, async () => {
    const resp = await mainWorker.fetch();
    const text = await resp.text();

    expect(text).toMatch(`<p>This is a suspended server component.</p>`);
  });
});
