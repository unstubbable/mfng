// The global awslambda namespace can be stubbed, since it's not needed in the
// dev server. Instead, the dev server consumes the handler app directly.
global.awslambda = {
  streamifyResponse: (handler) => handler,
  // @ts-expect-error
  HttpResponseStream: undefined,
};
