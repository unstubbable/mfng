import {sanitize} from 'htmlescape';

export function createInitialRscResponseTransformStream(
  rscStream: ReadableStream<Uint8Array>,
): ReadableWritablePair<Uint8Array, Uint8Array> {
  let rscStreamFinished: Promise<void> | undefined;

  return new TransformStream<Uint8Array, Uint8Array>({
    transform(chunk, controller) {
      controller.enqueue(chunk);

      if (!rscStreamFinished) {
        const reader = rscStream.getReader();
        const textDecoder = new TextDecoder();
        const textEncoder = new TextEncoder();

        controller.enqueue(
          textEncoder.encode(
            `<script>window.initialRscResponse = [];</script>`,
          ),
        );

        rscStreamFinished = new Promise(async (resolve) => {
          try {
            while (true) {
              const {done, value} = await reader.read();

              if (done) {
                return resolve();
              }

              controller.enqueue(
                textEncoder.encode(
                  `<script>window.initialRscResponse.push(${sanitize(
                    JSON.stringify(textDecoder.decode(value)),
                  )});</script>`,
                ),
              );
            }
          } catch (error) {
            controller.error(error);
          }
        });
      }
    },
    flush() {
      return rscStreamFinished;
    },
  });
}
