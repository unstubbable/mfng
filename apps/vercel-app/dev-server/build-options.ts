import path from 'path';
import url from 'url';
import type {BuildOptions} from 'esbuild';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));
const vercelOutputDirname = path.join(currentDirname, `../.vercel/output`);
const functionDirname = path.join(vercelOutputDirname, `functions/index.func`);
const entryPoint = path.join(functionDirname, `index.js`);
const outfile = path.join(currentDirname, `../dist/dev-server-handler.js`);

export const clientManifestFilename = path.join(
  functionDirname,
  `react-client-manifest.json`,
);

export const buildOptions: BuildOptions = {
  bundle: true,
  target: [`es2022`],
  entryPoints: [entryPoint],
  outfile,
  format: `esm`,
  external: [`node:async_hooks`],
  logLevel: `info`,
};
