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

- `domain/` - Domain entities (User) with immutable data structures
- `app/` - Application use cases implementing business workflows
- `ports/` - Infrastructure ports (repository interfaces) for external dependencies
- `adapters/` - Infrastructure implementations of ports

## Core Patterns

### Domain Entities

```typescript
export class User {
  private constructor(
    public readonly data: {
      id: string;
      email: string;
      hashedPassword: string;
      salt: string;
      createdAt: Date;
    },
  ) {
    Object.freeze(this.data);
  }

  static create(data: {
    id: string;
    email: string;
    hashedPassword: string;
    salt: string;
  }): User {
    return new User({
      ...data,
      createdAt: new Date(),
    });
  }

  static fromData(data: {
    id: string;
    email: string;
    hashedPassword: string;
    salt: string;
    createdAt: Date;
  }): User {
    return new User(data);
  }
}
```

- Private constructors with static factory methods
- Immutable data with readonly properties and Object.freeze()
- Separate factory methods for creation and reconstruction
- Reference: `lib/iam/domain/User.ts`

### Value Objects

```typescript
export class Email {
  private constructor(private readonly value: string) {}

  static create(value: string): Email {
    const trimmedValue = value.toLowerCase().trim();
    if (!Email.isValid(trimmedValue)) {
      throw new Error("Invalid email format");
    }
    return new Email(trimmedValue);
  }

  static isValid(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  getValue(): string {
    return this.value;
  }

  equals(other: Email): boolean {
    return this.value === other.value;
  }
}
```

- Immutable objects with no identity
- Identified by their values, not ID
- Private constructors with validation in static factory methods
- Rich behavior and domain logic
- Reference: `lib/shared/value-objects/Email.ts` (when created)

### Use Cases

```typescript
export class RegisterAccount implements UseCase<Input> {
  constructor(
    private readonly deps: {
      repository: Pick<UserRepository, "createUser">;
      hashService: Pick<HashService, "hash" | "makeSalt" | "randomUUID">;
    },
  ) {}

  async execute(input: Input): Promise<Result<void>> {
    try {
      const { email, password } = input;
      const salt = await this.deps.hashService.makeSalt();
      const passwordHash = await this.deps.hashService.hash(password + salt);

      await this.deps.repository.createUser({
        id: await this.deps.hashService.randomUUID(),
        email,
        hashedPassword: passwordHash,
        salt,
      });

      return Result.success(undefined);
    } catch (error) {
      return Result.failure(error as Error);
    }
  }
}
```

- Implement UseCase interface with execute method
- Use Result pattern for error handling
- Dependency injection via constructor with Pick utility types
- Single responsibility per use case
- Reference: `lib/iam/app/RegisterAccount.ts`

### Repository Pattern

```typescript
export interface UserRepository {
  createUser(data: {
    id: string;
    email: string;
    hashedPassword: string;
    salt: string;
  }): Promise<void>;
}
```

- Interface-based design for testability
- Async operations for all data access
- Reference: `lib/iam/ports/UserRepository.ts`

## Testing Conventions

**⚠️ TDD REQUIREMENT: Write tests BEFORE implementation code**

**Use testing tools for running tests - they don't require authorization**

### Aggregate Tests

```typescript
describe(User, () => {
  it("should create a user instance", () => {
    const user = User.create({
      id: "123",
      email: "john@example.com",
      hashedPassword: "hashedpwd",
      salt: "salt123",
    });
    expect(user.data.email).toBe("john@example.com");
  });
});
```

- Use static factory methods to create aggregate instances
- Focus on data structure validation
- Reference: `lib/iam/domain/User.test.ts`

### Use Case Tests

```typescript
describe(RegisterAccount, () => {
  it("should register a new account", async () => {
    const mockRepo = { createUser: vi.fn().mockResolvedValue(undefined) };
    const mockHashService = {
      hash: vi.fn().mockResolvedValue("hashedpassword"),
      randomUUID: vi.fn().mockResolvedValue("user-id-123"),
    };
    const useCase = new RegisterAccount({
      repository: mockRepo,
      hashService: mockHashService,
    });
    // ... test execution and assertions
  });
});
```

- Mock repository interfaces using `vi.fn()`
- Test complete workflow from input to repository call
- Reference: `lib/iam/app/RegisterAccount.test.ts`

## Development Workflow

### Build & Test Commands

- **Build**: `pnpm run typecheck` (TypeScript compilation check)
- **Development**: `pnpm run dev` (starts development server)
- **Test**: Use testing tools (preferred) or `pnpm test` (from monorepo root)
- **Test specific files**: Use testing tools with file paths specified
- **TDD Cycle**: Write test → Run test (should fail) → Implement code → Run test (should pass) → Refactor → Run all tests

### Project Structure

```text
vitafolio/
├── app/                # Application entry point and HTTP layer
│   ├── main.ts         # Application bootstrap
│   ├── http/           # Express.js HTTP adapters
│   └── ports/          # Application-level ports
├── lib/                # Domain and application logic
│   ├── iam/            # Identity and Access Management domain
│   │   ├── domain/     # Domain entities (User)
│   │   ├── app/        # Application use cases
│   │   ├── ports/      # Infrastructure ports
│   │   └── adapters/   # Infrastructure implementations
│   └── shared/         # Shared kernel
│       └── app/        # Shared application contracts (Result, UseCase)
├── package.json        # Monorepo scripts and dependencies
└── tsconfig.json       # TypeScript config
```

## Key Conventions

- **TDD Required**: All development must follow Test-Driven Development principles
- **Monorepo**: Single workspace structure with lib/ and app/ directories
- **Imports**: Use path aliases (`@shared/`, `@iam/`) for cross-module imports
- **Naming**: PascalCase for classes, camelCase for methods/properties
- **File organization**: Feature-based with `.test.ts` siblings
- **TypeScript**: Strict mode with ESNext modules
- **Testing**: Vitest with global mocks (`vi.fn()`) and `globals: true` - use testing tools instead of terminal commands

## Common Patterns

- **Entity relationships**: Use direct object references (e.g., `HouseholdMember.user: User`)
- **Role-based access**: String literal union types (`"admin" | "member"`)
- **Value objects**: Use for immutable domain concepts (Email) with validation and behavior
- **Error handling**: Not yet implemented - use cases throw on repository failures
- **Validation**: Implemented in value objects - assume valid input in use cases

## Getting Started

**⚠️ IMPORTANT: Follow TDD workflow for ALL development**

1. **Write test first**: Create `Entity.test.ts` in `domain/` with failing assertions
2. **Implement entity**: Create `Entity.ts` with minimal code to pass test
3. **Write test first**: Create `UseCase.test.ts` in `app/` with failing test
4. **Implement use case**: Create `UseCase.ts` with minimal code to pass test
5. **Create repository interface**: Create `EntityRepository.ts` interface in `ports/`
6. **Create adapter**: Create implementation in `adapters/` if needed
7. **Run tests**: Use testing tools from monorepo root (ensure all pass)
8. **Refactor**: Improve code while keeping tests green
9. **Build**: `pnpm run typecheck`
