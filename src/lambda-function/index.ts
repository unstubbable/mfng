import {
  ApiGatewayManagementApiClient,
  DeleteConnectionCommand,
  PostToConnectionCommand,
} from '@aws-sdk/client-apigatewaymanagementapi';
import type {APIGatewayProxyWebsocketHandlerV2} from 'aws-lambda';
import {z} from 'zod';

const apiGayewayClient = new ApiGatewayManagementApiClient({
  endpoint: process.env.API_GATEWAY_URL,
  region: process.env.AWS_REGION,
});

const EventBody = z.object({pathname: z.string().default(`/`)});

export const handler: APIGatewayProxyWebsocketHandlerV2 = async (event) => {
  console.log(`API_GATEWAY_URL`, process.env.API_GATEWAY_URL);
  console.log(`EVENT`, JSON.stringify(event));

  const {connectionId} = event.requestContext;
  const result = EventBody.safeParse(event.body && JSON.parse(event.body));

  if (!result.success) {
    await apiGayewayClient.send(
      new DeleteConnectionCommand({ConnectionId: connectionId}),
    );

    return {statusCode: 400};
  }

  const {pathname} = result.data;

  const htmlLines = [
    `<!doctype html>`,
    `<html>`,
    `<body style="font-family: sans-serif;">`,
    `<h1>Streaming Test ${pathname}</h1>`,
    `<div>1 </div>`,
    `<div>2 </div>`,
    `<style>div{color: red}</style>`,
    `<div>3 </div>`,
    `<script>document.title = 'A script set the title!'</script>`,
    `<div>4 </div>`,
    `<div>5 </div>`,
    `</body>`,
    `</html>`,
  ];

  const stream = new ReadableStream({
    async start(controller) {
      for (const line of htmlLines) {
        await Promise.resolve();
        controller.enqueue(line);
      }

      controller.close();
    },
  }).pipeThrough(new TextEncoderStream());

  const reader = stream.getReader();

  while (true) {
    const {done, value} = await reader.read();

    await apiGayewayClient.send(
      new PostToConnectionCommand({ConnectionId: connectionId, Data: value}),
    );

    if (done) {
      await apiGayewayClient.send(
        new DeleteConnectionCommand({ConnectionId: connectionId}),
      );

      break;
    }
  }

  return {statusCode: 200};
};
