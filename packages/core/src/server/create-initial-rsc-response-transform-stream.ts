import {sanitize} from 'htmlescape';
import {nextMacroTask} from './next-macro-task.js';

const closingBodyHtmlText = `</body></html>`;

export function createInitialRscResponseTransformStream(
  rscStream: ReadableStream<Uint8Array>,
): ReadableWritablePair<Uint8Array, Uint8Array> {
  let removedClosingBodyHtmlText = false;
  let insertingRscStreamScripts: Promise<void> | undefined;
  let finishedInsertingRscStreamScripts = false;

  const textDecoder = new TextDecoder();
  const textEncoder = new TextEncoder();

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      const text = textDecoder.decode(chunk);

      if (
        text.endsWith(closingBodyHtmlText) &&
        !finishedInsertingRscStreamScripts
      ) {
        const [withoutClosingBodyHtmlText] = text.split(closingBodyHtmlText);

        controller.enqueue(textEncoder.encode(withoutClosingBodyHtmlText));

        removedClosingBodyHtmlText = true;
      } else {
        controller.enqueue(chunk);
      }

      insertingRscStreamScripts ||= new Promise(async (resolve) => {
        const reader = rscStream.getReader();

        try {
          while (true) {
            const result = await reader.read();

            if (result.done) {
              finishedInsertingRscStreamScripts = true;

              if (removedClosingBodyHtmlText) {
                controller.enqueue(textEncoder.encode(closingBodyHtmlText));
              }

              return resolve();
            }

            await nextMacroTask();

            // Expects `self.addInitialRscResponseChunk` to be defined in
            // `bootstrapScriptContent`. If we were to enqueue the
            // initialization script in this controller, it might be parsed and
            // evaluated by the browser after the bootstrap script tries to read
            // from `self.initialRscResponseStream`. Defining it in
            // `bootstrapScriptContent` avoids this race condition.
            controller.enqueue(
              textEncoder.encode(
                `<script>self.addInitialRscResponseChunk(${sanitize(
                  JSON.stringify(textDecoder.decode(result.value)),
                )});</script>`,
              ),
            );
          }
        } catch (error) {
          controller.error(error);
        }
      });
    },

    async flush() {
      return insertingRscStreamScripts;
    },
  });
}
