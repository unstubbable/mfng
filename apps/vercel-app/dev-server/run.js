import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import {EdgeRuntime, createHandler} from 'edge-runtime';
import {build} from 'esbuild';
import express from 'express';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));
const entryPoint = path.join(currentDirname, `fetch-event-listener.js`);
const outfile = path.join(currentDirname, `../dist/dev-server.js`);
const staticDirname = path.join(currentDirname, `../.vercel/output/static`);

await build({
  bundle: true,
  target: [`es2022`],
  entryPoints: [entryPoint],
  outfile,
  format: `esm`,
  logLevel: `info`,
});

const code = await fs.readFile(outfile);
const runtime = new EdgeRuntime({initialCode: code.toString()});
const {handler} = createHandler({runtime});
const app = express();

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

  server.close(() => {
    console.log(`Dev server closed. Exiting...`);
    process.exit(0);
  });
});
