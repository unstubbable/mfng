import fs from 'fs';
import path from 'path';
import url from 'url';
import {defaults} from 'jest-config';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));

const swcConfig = JSON.parse(
  fs.readFileSync(`${currentDirname}/.swcrc`, `utf-8`),
);

/**
 * @type {import('jest').Config}
 */
export default {
  clearMocks: true,
  collectCoverage: true,
  extensionsToTreatAsEsm: [`.ts`, `.tsx`],
  moduleFileExtensions: [...defaults.moduleFileExtensions, `cts`],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.c?js$': `$1`,
  },
  restoreMocks: true,
  testMatch: [`**/src/**/*.test.{ts,tsx}`],
  transform: {
    '^.+\\.tsx?$': [`@swc/jest`, swcConfig],
    '^.+\\.cts$': [`@swc/jest`, swcConfig],
  },
};
