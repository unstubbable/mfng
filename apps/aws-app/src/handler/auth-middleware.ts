import type {MiddlewareHandler} from 'hono';

export const authMiddleware: MiddlewareHandler = async (context, next) => {
  if (
    context.req.header(`X-Origin-Verify`) !==
    process.env.AWS_HANDLER_VERIFY_HEADER
  ) {
    return context.text(`Unauthorized`, 401);
  }

  return next();
};
