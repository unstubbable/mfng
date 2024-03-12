import type {LambdaFunctionURLEvent} from 'aws-lambda';

export function createRequestFromEvent(event: LambdaFunctionURLEvent): Request {
  const {
    body,
    headers,
    isBase64Encoded,
    rawPath,
    rawQueryString,
    requestContext,
  } = event;

  const {domainName, http} = requestContext;
  const {method} = http;
  const protocol = domainName === `localhost` ? `http:` : `https:`;
  const url = new URL(rawPath, `${protocol}//${domainName}`);

  url.search = new URLSearchParams(rawQueryString).toString();

  return new Request(url, {
    method,
    body: isBase64Encoded && body ? atob(body) : body,
    headers: headers as Record<string, string>,
  });
}
