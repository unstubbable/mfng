/**
 * @type {ExportedHandler}
 */
export default {
  async fetch(request, env) {
    const webSocketUrl = env.WEB_SOCKET_URL;

    if (webSocketUrl) {
      console.log(`Using ${webSocketUrl}`);
    } else {
      throw new Error(`env.WEB_SOCKET_URL is not defined.`);
    }

    const ws = new WebSocket(webSocketUrl);
    const textEncoder = new TextEncoder();
    const {readable, writable} = new TransformStream();
    const writer = writable.getWriter();
    const {pathname} = new URL(request.url);

    ws.addEventListener(`open`, () => {
      ws.send(JSON.stringify({pathname}));
    });

    ws.addEventListener(`message`, (event) => {
      console.log(`got data`, event.data);
      writer.write(textEncoder.encode(event.data));
    });

    ws.addEventListener(`close`, () => {
      console.log(`close`);
      writable.close();
    });

    ws.addEventListener(`error`, () => {
      console.log(`error`);
      writable.close();
    });

    return new Response(readable, {headers: {'content-type': `text/html`}});
  },
};
