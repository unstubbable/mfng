import {nextMacroTask} from './next-macro-task.js';

export function createBufferedTransformStream(): ReadableWritablePair<
  Uint8Array,
  Uint8Array
> {
  let bufferedChunks: Uint8Array[] = [];
  let buffering: Promise<void> | undefined;

  return new TransformStream({
    transform(chunk, controller) {
      bufferedChunks.push(chunk);

      buffering ||= new Promise(async (resolve) => {
        await nextMacroTask();

        controller.enqueue(concatenateChunks(bufferedChunks));

        bufferedChunks = [];
        buffering = undefined;

        resolve();
      });
    },

    async flush() {
      return buffering;
    },
  });
}

function concatenateChunks(chunks: Uint8Array[]): Uint8Array {
  const result = new Uint8Array(
    chunks.reduce((totalLength, chunk) => totalLength + chunk.length, 0),
  );

  let offset = 0;

  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }

  return result;
}
