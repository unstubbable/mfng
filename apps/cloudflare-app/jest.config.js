import fs from 'fs';
import path from 'path';
import url from 'url';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

const swcConfig = JSON.parse(
  fs.readFileSync(`${currentDirname}/.swcrc`, `utf-8`),
);

/**
 * @type {import('jest').Config}
 */
export default {
  collectCoverage: true,
  extensionsToTreatAsEsm: [`.ts`],
  testMatch: [`**/src/**/*.test.ts`],
  transform: {'^.+\\.ts$': [`@swc/jest`, swcConfig]},
};
