# Result/Either Pattern Usage

This documentation explains how to use the new Result/Either pattern implemented in the `UseCase` interface.

## Basic Concepts

The Result/Either pattern enables more explicit and functional error handling, avoiding the use of exceptions for flow control.

### Types

```typescript
// A Result can be success or failure
const success = Result.success("value");
const failure = Result.failure(new Error("error"));
```

### State Checking

```typescript
if (result.isSuccess()) {
  const value = result.getValue();
  // use the value
} else {
  const error = result.getError();
  // handle the error
}
```

## Updated UseCase Interface

```typescript
export interface UseCase<I = void, O = void> {
  execute(input: I): Promise<Result<O>>;
}
```

## Use Case Implementation

```typescript
export class CreateUserUseCase implements UseCase<CreateUserInput, User> {
  async execute(input: CreateUserInput): Promise<Result<User>> {
    try {
      // use case logic
      const user = await this.userRepository.create(input);
      return Result.success(user);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}
```

## HTTP Handlers

```typescript
export const makeUserHandler = (deps: Deps) => {
  return async (req: Request, res: Response) => {
    const result = await deps.createUser(req.body);

    if (result.isSuccess()) {
      res.status(201).json(result.getValue());
    } else {
      res.status(400).json({ error: result.getError().message });
    }
  };
};
```

## Advantages

1. **Explicit**: The type forces error handling
2. **Type-safe**: TypeScript ensures correct usage
3. **Testable**: Easy to mock and test
4. **Consistent**: Uniform pattern across the codebase

## Migration

To migrate existing use cases:

1. Update the return type to `Promise<Result<T>>`
2. Wrap success values with `Result.success()`
3. Catch errors and return `Result.failure()`
4. Update handlers to check `isSuccess()`
5. Update tests to verify Results
