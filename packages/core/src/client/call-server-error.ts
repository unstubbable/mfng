export class CallServerError extends Error {
  #statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.#statusCode = statusCode;
  }

  get statusCode(): number {
    return this.#statusCode;
  }
}
