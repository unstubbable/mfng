import type {MiddlewareHandler} from 'hono';

const verifyHeader = process.env.AWS_HANDLER_VERIFY_HEADER;

export const authMiddleware: MiddlewareHandler = async (context, next) => {
  if (verifyHeader) {
    context.req.raw.headers.set(`X-Origin-Verify`, verifyHeader);
  } else {
    console.warn(`process.env.AWS_HANDLER_VERIFY_HEADER is undefined`);
  }

  return next();
};
