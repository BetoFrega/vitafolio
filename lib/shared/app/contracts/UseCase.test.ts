import type { UseCase } from "./UseCase";
import { Result } from "./Result";

// Mock use case for testing
class TestUseCase implements UseCase<string, number> {
  async execute(input: string): Promise<Result<number>> {
    if (input === "error") {
      return Result.failure(new Error("Test error"));
    }
    return Result.success(input.length);
  }
}

describe("UseCase with Result", () => {
  let useCase: TestUseCase;

  beforeEach(() => {
    useCase = new TestUseCase();
  });

  it("should return Result<O> from execute method", async () => {
    const result = await useCase.execute("hello");

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue()).toBe(5);
  });

  it("should return failure Result when error occurs", async () => {
    const result = await useCase.execute("error");

    expect(result.isFailure()).toBe(true);
    expect(result.getError().message).toBe("Test error");
  });

  it("should work with void input type", async () => {
    class VoidInputUseCase implements UseCase<void, string> {
      async execute(): Promise<Result<string>> {
        return Result.success("success");
      }
    }

    const voidUseCase = new VoidInputUseCase();
    const result = await voidUseCase.execute();

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue()).toBe("success");
  });

  it("should work with void output type", async () => {
    class VoidOutputUseCase implements UseCase<string, void> {
      async execute(input: string): Promise<Result<void>> {
        if (input === "error") {
          return Result.failure(new Error("Test error"));
        }
        return Result.success(undefined);
      }
    }

    const voidUseCase = new VoidOutputUseCase();
    const result = await voidUseCase.execute("test");

    expect(result.isSuccess()).toBe(true);
    expect(result.getValue()).toBe(undefined);
  });
});
