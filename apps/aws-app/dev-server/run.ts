import {serve} from '@hono/node-server';
import {serveStatic} from '@hono/node-server/serve-static';
import {Hono} from 'hono';
import type {StatusCode} from 'hono/utils/http-status';
// @ts-ignore
import handler from '../dist/handler/index.js';
import type {Handler} from '../src/handler/index.js';
import {transformHeaders} from './transform-headers.js';

const app = new Hono();

app.use(`/client/*`, serveStatic({root: `dist/static`}));

app.all(`*`, async (context) => {
  const response = await (handler as Handler)(context.req.raw);
  const status = response.status as StatusCode;
  const headers = transformHeaders(response.headers);

  return context.newResponse(response.body, status, headers);
});

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
