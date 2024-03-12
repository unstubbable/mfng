import type {Readable} from 'stream';
import {PassThrough} from 'stream';
import type {
  APIGatewayEventRequestContextV2,
  Context as LambdaContext,
  LambdaFunctionURLEvent,
} from 'aws-lambda';
import type {Context as HonoContext} from 'hono';

export type MockStreamifiedResponseHandler = (
  honoContext: HonoContext,
) => Promise<ResponseStreamResult>;

export interface ResponseStreamResult extends awslambda.ResponseStreamMetaData {
  readonly body: Readable;
}

class ResponseStream extends PassThrough implements awslambda.ResponseStream {
  #contentType: string | undefined;
  #resolve: (result: ResponseStreamResult) => void;

  constructor(resolve: (result: ResponseStreamResult) => void) {
    super();
    this.#resolve = resolve;
  }

  sendResponseHeader(metadata: awslambda.ResponseStreamMetaData) {
    const {headers, statusCode} = metadata;

    if (this.#contentType) {
      headers[`Content-Type`] = this.#contentType;
    }

    this.#resolve({statusCode, headers, body: this});
  }

  setContentType(contentType: string) {
    this.#contentType = contentType;
  }
}

class HttpResponseStream implements awslambda.HttpResponseStream {
  static from(
    responseStream: ResponseStream,
    metadata: awslambda.ResponseStreamMetaData,
  ): awslambda.ResponseStream {
    responseStream.sendResponseHeader(metadata);

    return responseStream;
  }
}

function streamifyResponse(
  handler: awslambda.ResponseStreamHandler<LambdaFunctionURLEvent>,
): MockStreamifiedResponseHandler {
  return async (honoContext: HonoContext) => {
    const event = await createLambdaEvent(honoContext);
    const context = createLambdaContext(honoContext);

    return new Promise<ResponseStreamResult>(async (resolve, reject) => {
      const responseStream = new ResponseStream(resolve);

      try {
        await handler(event, responseStream, context);
      } catch (error) {
        reject(error);
      }
    });
  };
}

async function createLambdaEvent(
  honoContext: HonoContext,
): Promise<LambdaFunctionURLEvent> {
  const {method, raw} = honoContext.req;
  const body = method === `POST` ? await raw.text() : undefined;

  const event: Partial<LambdaFunctionURLEvent> = {
    body,
    requestContext: {
      domainName: `localhost`,
      http: {method},
    } as APIGatewayEventRequestContextV2,
  };

  return event as LambdaFunctionURLEvent;
}

function createLambdaContext(_honoContext: HonoContext): LambdaContext {
  const context: Partial<LambdaContext> = {};

  return context as LambdaContext;
}

global.awslambda = {
  streamifyResponse:
    streamifyResponse as unknown as typeof awslambda.streamifyResponse,
  HttpResponseStream,
};
