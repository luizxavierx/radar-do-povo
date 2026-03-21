export class ApiRequestError extends Error {
  public requestId?: string;
  public statusCode?: number;

  constructor(message: string, opts?: { requestId?: string; statusCode?: number }) {
    super(message);
    this.name = "ApiRequestError";
    this.requestId = opts?.requestId;
    this.statusCode = opts?.statusCode;
  }
}
