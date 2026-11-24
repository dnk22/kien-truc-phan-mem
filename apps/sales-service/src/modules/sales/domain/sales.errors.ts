export class SalesError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 409) {
    super(message);
  }
}

export class RemoteError extends Error {
  constructor(public readonly status: number, public readonly code: string) { super(code); }
}
