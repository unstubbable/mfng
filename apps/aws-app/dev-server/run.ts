import {Readable} from 'stream';
import {serve} from '@hono/node-server';
import {serveStatic} from '@hono/node-server/serve-static';
import {Hono} from 'hono';
import type {MockStreamifiedResponseHandler} from './streamify-response.js';

await import(`./streamify-response.js`);

const app = new Hono();

app.use(`/client/*`, serveStatic({root: `dist/static`}));

app.all(`*`, async (context) => {
  // @ts-ignore
  const handlerModule = await import(`../dist/handler/index.js`);
  const handler: MockStreamifiedResponseHandler = handlerModule.handler;
  const {body, statusCode, headers} = await handler(context);

  return new Response(Readable.toWeb(body) as ReadableStream, {
    status: statusCode,
    headers,
  });
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
