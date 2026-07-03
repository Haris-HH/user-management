// Types
import type {
  ErrorRespond
} from "../types/common";

export class ApiError extends Error {
  endpoint: string;
  statusCode: number;
  success: boolean;

  constructor(error: ErrorRespond) {
    super(error.message);

    this.name = "ApiError";
    this.endpoint = error.endpoint;
    this.statusCode = error.statusCode;
    this.success = error.success;
  }

  toJSON(): ErrorRespond {
    return {
      endpoint: this.endpoint,
      statusCode: this.statusCode,
      success: this.success,
      message: this.message,
    };
  }
}