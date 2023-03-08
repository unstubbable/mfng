import {nextMacroTask} from './next-macro-task.js';

export function createBufferedTransformStream(): ReadableWritablePair<
  Uint8Array,
  Uint8Array
> {
  let bufferedText = ``;
  let buffering: Promise<void> | undefined;

  return new TransformStream({
    transform(chunk, controller) {
      bufferedText += new TextDecoder().decode(chunk);

      buffering ||= new Promise(async (resolve) => {
        await nextMacroTask();

        controller.enqueue(new TextEncoder().encode(bufferedText));

        bufferedText = ``;
        buffering = undefined;

        resolve();
      });
    },

    flush() {
      return buffering;
    },
  });
}
