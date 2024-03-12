declare namespace awslambda {
  import type {Duplex} from 'stream';
  import type {Context} from 'aws-lambda';

  type ResponseStreamHandler<TEvent> = (
    event: TEvent,
    responseStream: ResponseStream,
    context: Context,
  ) => Promise<void>;

  type ResponseStream = Duplex & {
    setContentType(contentType: string): void;
  };

  interface ResponseStreamMetaData {
    readonly statusCode: number;
    readonly headers: Record<string, string>;
  }

  class HttpResponseStream {
    static from(
      responseStream: ResponseStream,
      metadata: ResponseStreamMetaData,
    ): ResponseStream;
  }

  const streamifyResponse: <TEvent>(
    handler: ResponseStreamHandler<TEvent>,
  ) => ResponseStreamHandler<TEvent>;
}
