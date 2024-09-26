import fs from 'fs/promises';
import path from 'path';
import url from 'url';
import {serve} from '@hono/node-server';
import {serveStatic} from '@hono/node-server/serve-static';
import {Hono} from 'hono';
import {authMiddleware} from './auth-middleware.js';
import './stub-awslambda.js';

// @ts-ignore
const handlerModule = await import(`../dist/handler/index.js`);
const {app: handlerApp} = handlerModule as {app: Hono};
const app = new Hono();

app.use(authMiddleware);
app.use(`/client/*`, serveStatic({root: `dist/static`}));

app.get(`/source-maps`, async (context) => {
  const filenameQueryParam = context.req.query(`filename`);

  if (!filenameQueryParam) {
    return context.newResponse(`Missing query parameter "filename"`, 400);
  }

  const filename = filenameQueryParam.startsWith(`file://`)
    ? url.fileURLToPath(filenameQueryParam)
    : path.join(import.meta.dirname, `../dist/static`, filenameQueryParam);

  try {
    const sourceMapFilename = `${filename}.map`;
    const sourceMapContents = await fs.readFile(sourceMapFilename);

    return context.newResponse(sourceMapContents);
  } catch (error) {
    console.error(error);
    return context.newResponse(null, 404);
  }
});

app.route(`/`, handlerApp);

const server = serve({fetch: app.fetch, port: 3002}, ({address, port}) => {
  const serverUrl = `http://${address.replace(`0.0.0.0`, `localhost`)}:${port}`;

  return console.log(`Started dev server at ${serverUrl}`);
});

process.on(`SIGINT`, () => {
  console.log(`Closing dev server`);

  server.close((error) => {
    if (error) {
      console.error(error);
      process.exit(1);
    }

    console.log(`Dev server closed`);
    process.exit(0);
  });
});
