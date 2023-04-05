export {}; // ts(2669)

declare global {
  interface Window {
    initialRscResponseStream: Readable<Uint8Array>;
  }
}
