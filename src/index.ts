import type {ProxyHandler} from 'aws-lambda';

// eslint-disable-next-line @typescript-eslint/require-await
export const handler: ProxyHandler = async () => {
  return {statusCode: 200, body: `Hello, world!`};
};
