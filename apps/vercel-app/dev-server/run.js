import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import {EdgeRuntime, createHandler} from 'edge-runtime';
import esbuild from 'esbuild';
import express from 'express';

const currentDirname = path.dirname(url.fileURLToPath(import.meta.url));
const entryPoint = path.join(currentDirname, `fetch-event-listener.js`);
const outfile = path.join(currentDirname, `../dist/dev-server.js`);
const staticDirname = path.join(currentDirname, `../.vercel/output/static`);
const runtime = new EdgeRuntime();

const buildContext = await esbuild.context({
  bundle: true,
  target: [`es2022`],
  entryPoints: [entryPoint],
  outfile,
  format: `esm`,
  logLevel: `info`,
  plugins: [
    {
      name: `mfng-dev-server-watch-plugin`,
      setup: (build) => {
        build.onEnd(async (result) => {
          for (const error of result.errors) {
            console.error(error);
          }

          for (const warning of result.warnings) {
            console.warn(warning);
          }

          const code = await fs.readFile(outfile);

          runtime.evaluate(code.toString());
        });
      },
    },
  ],
});

await buildContext.watch();
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

  await buildContext.dispose();

  server.close(() => {
    console.log(`Dev server closed. Exiting...`);
    process.exit(0);
  });
});
