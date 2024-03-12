import {Readable} from 'stream';
import {pipeline} from 'stream/promises';
import type {ReadableStream} from 'stream/web';

export async function pipeResponse(
  response: Response,
  responseStream: awslambda.ResponseStream,
): Promise<void> {
  responseStream = awslambda.HttpResponseStream.from(responseStream, {
    statusCode: response.status,
    headers: transformHeaders(response.headers),
  });

  if (!response.body) {
    responseStream.end();

    return;
  }

  return pipeline(
    Readable.fromWeb(response.body as ReadableStream),
    responseStream,
  );
}

function transformHeaders(headers: Headers): Record<string, string> {
  const headersRecord: Record<string, string> = {};

  headers.forEach((value, key) => {
    const prevValue = headersRecord[key];

    if (typeof prevValue === `string`) {
      headersRecord[key] = `${prevValue},${value}`;
    } else {
      headersRecord[key] = value;
    }
  });

  return headersRecord;
}
