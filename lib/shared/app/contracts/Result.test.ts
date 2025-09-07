import { Result } from "./Result";

describe("Result", () => {
  describe("success", () => {
    it("should create a successful result", () => {
      const result = Result.success("test value");

      expect(result.isSuccess()).toBe(true);
      expect(result.isFailure()).toBe(false);
      expect(result.getValue()).toBe("test value");
    });

    it("should throw when trying to get error from success", () => {
      const result = Result.success("test");

      expect(() => result.getError()).toThrow(
        "Cannot get error from success result",
      );
    });
  });

  describe("failure", () => {
    it("should create a failure result", () => {
      const error = new Error("test error");
      const result = Result.failure(error);

      expect(result.isSuccess()).toBe(false);
      expect(result.isFailure()).toBe(true);
      expect(result.getError()).toBe(error);
    });

    it("should throw when trying to get value from failure", () => {
      const result = Result.failure(new Error("test"));

      expect(() => result.getValue()).toThrow(
        "Cannot get value from failure result",
      );
    });
  });
});
