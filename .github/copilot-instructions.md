# Vitafolio - AI Coding Agent Instructions

## ⚠️ REQUIRED: Test-Driven Development (TDD)

**ALL CODE CHANGES MUST FOLLOW TDD PRINCIPLES:**

1. **Red**: Write a failing test first before implementing any code
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code while keeping tests passing

### TDD Workflow Requirements:

- **Never write production code without a failing test**
- **Tests must be written BEFORE implementation**
- **Run tests frequently** (use testing tools) to ensure nothing breaks
- **All tests must pass** before committing changes
- **Test file names**: Always create `.test.ts` files alongside implementation files

### When Adding New Features:

1. **Write test first** - Define expected behavior with failing assertions
2. **Implement minimal code** - Just enough to make test pass
3. **Refactor safely** - Improve code while tests remain green
4. **Verify all tests pass** - Run full test suite before proceeding

## Architecture Overview

**Clean Architecture Pattern**: Domain → Application → Infrastructure layers

- `aggregates/` - Domain entities (User, Household) with immutable data structures
- `use-cases/` - Application logic orchestrating domain operations
- `ports/` - Infrastructure ports (repository interfaces) for external dependencies

## Core Patterns

### Domain Aggregates

```typescript
export class User {
  private constructor(public data: { fullName: string; email: string }) {}

  static create(data: { fullName: string; email: string }): User {
    return new User(data);
  }
}
```

- Private constructors with static factory methods
- Immutable data passed via constructor
- No business logic in aggregates - pure data containers
- Reference: `packages/vitafolio/src/aggregates/User.ts`

### Use Cases

```typescript
export class CreateUserUseCase {
  constructor(private userRepository: UserRepository) {}
  async execute(data: { fullName: string; email: string }): Promise<User> {
    const user = User.create(data);
    await this.userRepository.save(user);
    return user;
  }
}
```

- Dependency injection via constructor
- Single responsibility per use case
- Async operations with repository interfaces
- Use static factory methods to create aggregates
- Reference: `packages/vitafolio/src/use-cases/CreateUserUseCase.ts`

### Repository Pattern

```typescript
export interface UserRepository {
  save(user: User): Promise<void>;
}
```

- Interface-based design for testability
- Async operations for all data access
- Reference: `packages/vitafolio/src/ports/UserRepository.ts`

## Testing Conventions

**⚠️ TDD REQUIREMENT: Write tests BEFORE implementation code**

**Use testing tools for running tests - they don't require authorization**

### Aggregate Tests

```typescript
describe(User, () => {
  it("should create a user instance", () => {
    const user = User.create({
      fullName: "John Doe",
      email: "john@example.com",
    });
    expect(user.data.fullName).toBe("John Doe");
  });
});
```

- Use static factory methods to create aggregate instances
- Focus on data structure validation
- Reference: `packages/vitafolio/src/aggregates/User.test.ts`

### Use Case Tests

```typescript
describe(CreateUserUseCase, () => {
  it("should create and save a user", async () => {
    const mockRepo = { save: vi.fn().mockResolvedValue(undefined) };
    const useCase = new CreateUserUseCase(mockRepo);
    // ... test execution and assertions
  });
});
```

- Mock repository interfaces using `vi.fn()`
- Test complete workflow from input to repository call
- Reference: `packages/vitafolio/src/use-cases/CreateUserUseCase.test.ts`

## Development Workflow

### Build & Test Commands

- **Build**: `cd packages/vitafolio && npm run build` (TypeScript compilation)
- **Watch mode**: `cd packages/vitafolio && npm run dev` (continuous compilation)
- **Test**: Use testing tools (preferred) or `npx vitest run` (from monorepo root)
- **Test specific files**: Use testing tools with file paths specified
- **TDD Cycle**: Write test → Run test (should fail) → Implement code → Run test (should pass) → Refactor → Run all tests

### Project Structure

```
packages/vitafolio/
├── src/
│   ├── aggregates/     # Domain entities
│   ├── use-cases/      # Application logic
│   └── ports/          # Infrastructure ports (interfaces)
├── package.json        # Package-specific scripts
└── tsconfig.json       # TypeScript config
```

## Key Conventions

- **TDD Required**: All development must follow Test-Driven Development principles
- **Monorepo**: pnpm workspaces with `packages/*` structure
- **Imports**: Relative paths within packages (`../aggregates/User`)
- **Naming**: PascalCase for classes, camelCase for methods/properties
- **File organization**: Feature-based with `.test.ts` siblings
- **TypeScript**: Strict mode with ESNext modules
- **Testing**: Vitest with global mocks (`vi.fn()`) and `globals: true` - use testing tools instead of terminal commands

## Common Patterns

- **Entity relationships**: Use direct object references (e.g., `HouseholdMember.user: User`)
- **Role-based access**: String literal union types (`"admin" | "member"`)
- **Error handling**: Not yet implemented - use cases throw on repository failures
- **Validation**: Not yet implemented - assume valid input in use cases

## Getting Started

**⚠️ IMPORTANT: Follow TDD workflow for ALL development**

1. **Write test first**: Create `Aggregate.test.ts` in `aggregates/` with failing assertions
2. **Implement aggregate**: Create `Aggregate.ts` with minimal code to pass test
3. **Write use case test**: Create `UseCase.test.ts` in `use-cases/` with failing test
4. **Implement use case**: Create `UseCase.ts` with minimal code to pass test
5. **Create repository interface**: Create `EntityRepository.ts` interface in `ports/`
6. **Run tests**: Use testing tools from monorepo root (ensure all pass)
7. **Refactor**: Improve code while keeping tests green
8. **Build**: `cd packages/vitafolio && npm run build`
