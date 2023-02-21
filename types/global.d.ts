export {}; // ts(2669)

declare global {
  interface Window {
    initialRscResponse: string[];
  }
}
