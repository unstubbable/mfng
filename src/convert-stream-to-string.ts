export async function convertStreamToString(
  readableStream: ReadableStream<Uint8Array>,
): Promise<string> {
  let result = ``;
  const reader = readableStream.getReader();

  while (true) {
    const {done, value} = await reader.read();

    if (done) {
      return result;
    }

    result += new TextDecoder().decode(value);
  }
}
