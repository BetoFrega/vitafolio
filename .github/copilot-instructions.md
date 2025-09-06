# Vitafolio - AI Coding Agent Instructions

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
- **Test**: `npx vitest run` (from monorepo root)
- **Test specific files**: `npx vitest run path/to/file.test.ts`

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

- **Monorepo**: pnpm workspaces with `packages/*` structure
- **Imports**: Relative paths within packages (`../aggregates/User`)
- **Naming**: PascalCase for classes, camelCase for methods/properties
- **File organization**: Feature-based with `.test.ts` siblings
- **TypeScript**: Strict mode with ESNext modules
- **Testing**: Vitest with global mocks (`vi.fn()`) and `globals: true`

## Common Patterns

- **Entity relationships**: Use direct object references (e.g., `HouseholdMember.user: User`)
- **Role-based access**: String literal union types (`"admin" | "member"`)
- **Error handling**: Not yet implemented - use cases throw on repository failures
- **Validation**: Not yet implemented - assume valid input in use cases

## Getting Started

1. **New aggregate**: Create `Aggregate.ts` + `Aggregate.test.ts` in `aggregates/`
2. **New use case**: Create `UseCase.ts` + `UseCase.test.ts` in `use-cases/`
3. **New repository**: Create `EntityRepository.ts` interface in `ports/`
4. **Run tests**: `npx vitest run` from monorepo root
5. **Build**: `cd packages/vitafolio && npm run build`
