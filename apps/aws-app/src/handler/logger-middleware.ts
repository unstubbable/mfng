import type {LambdaFunctionURLEvent} from 'aws-lambda';
import type {MiddlewareHandler} from 'hono';

export const loggerMiddleware: MiddlewareHandler<{
  Bindings: {
    // Not available in dev server.
    event?: LambdaFunctionURLEvent;
  };
}> = async ({req, env: {event}}, next) => {
  if (event) {
    console.log(`EVENT`, JSON.stringify(event));
  } else {
    const {url, method} = req;
    const headers = req.header();

    console.log(JSON.stringify({method, url, headers}));
  }

  return next();
};
