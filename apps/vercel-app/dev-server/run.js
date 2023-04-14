import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import chokidar from 'chokidar';
import {EdgeRuntime, createHandler} from 'edge-runtime';
import esbuild from 'esbuild';
import express from 'express';
import {debounce} from './debounce.js';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));
const entryPoint = path.join(currentDirname, `fetch-event-listener.js`);
const outfile = path.join(currentDirname, `../dist/dev-server.js`);
const vercelOutputDirname = path.join(currentDirname, `../.vercel/output`);
const staticDirname = path.join(vercelOutputDirname, `static`);
const functionDirname = path.join(vercelOutputDirname, `functions/index.func`);
const runtime = new EdgeRuntime();

const buildContext = await esbuild.context({
  bundle: true,
  target: [`es2022`],
  entryPoints: [entryPoint],
  outfile,
  format: `esm`,
  logLevel: `info`,
});

const rebuild = debounce(async () => {
  await buildContext.rebuild();

  const code = await fs.readFile(outfile);

  runtime.evaluate(code.toString());
  console.log(`Re-evaluated edge runtime.`);
}, 300);

chokidar
  .watch(functionDirname, {ignored: [/\.txt$/, /\.map$/]})
  .on(`add`, rebuild)
  .on(`change`, rebuild);

const {handler} = createHandler({runtime});
const app = express();

// Redirecting insights script for local production mode.
app.get(`/_vercel/insights/script.js`, (_req, res) =>
  res.redirect(`https://va.vercel-scripts.com/v1/script.debug.js`),
);

app.use(express.static(staticDirname));
app.use(handler);

const server = app.listen(3001, () => {
  const {address, port} = /** @type {import('net').AddressInfo} */ (
    server.address()
  );

  const serverUrl = `http://${address.replace(`::`, `localhost`)}:${port}`;

  return console.log(`Started dev server at ${serverUrl}`);
});

process.on(`SIGINT`, async () => {
  console.log(`Shutting down the dev server...`);

  await buildContext.dispose();

  server.close(() => {
    console.log(`Dev server closed. Exiting...`);
    process.exit(0);
  });
});
