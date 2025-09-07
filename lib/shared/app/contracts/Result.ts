export class Result<T> {
  private constructor(
    private readonly value?: T,
    private readonly error?: Error,
    private readonly success: boolean = true,
  ) {}

  static success<T>(value: T): Result<T> {
    return new Result(value, undefined, true);
  }

  static failure<T>(error: Error): Result<T> {
    return new Result<T>(undefined, error, false);
  }

  isSuccess(): boolean {
    return this.success;
  }

  isFailure(): boolean {
    return !this.success;
  }

  getValue(): T {
    if (!this.success) {
      throw new Error("Cannot get value from failure result");
    }
    return this.value!;
  }

  getError(): Error {
    if (this.success) {
      throw new Error("Cannot get error from success result");
    }
    return this.error!;
  }
}
