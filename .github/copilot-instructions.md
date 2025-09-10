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
- **Test file names**:
  - Domain/Use Case tests: `.test.ts` alongside implementation files
  - App layer tests: `*.contract.test.ts`, `*.integration.test.ts`, `*.e2e.test.ts`
- **Test type selection**:
  - Contract tests: Define API endpoints during TDD
  - Integration tests: Test business workflows
  - E2E tests: Pre-deployment verification with real implementations

## Architecture Overview

**Clean Architecture Pattern**: Domain → Application → Infrastructure layers

- `domain/` - Domain entities with immutable data structures
- `app/` - Application use cases implementing business workflows
- `ports/` - Infrastructure ports (repository interfaces) for external dependencies
- `adapters/` - Infrastructure implementations of ports

## Core Design Principles

### Domain Entities

- **Private constructors** with static factory methods (`create()`, `fromData()`)
- **Immutable data** with readonly properties and `Object.freeze()`
- **Rich domain behavior** - methods that operate on entity data
- **No external dependencies** - pure domain logic only

### Value Objects

- **Immutable objects** with no identity (identified by their values)
- **Private constructors** with validation in static factory methods
- **Rich behavior** and domain logic encapsulation
- **Equality comparison** based on values, not reference

### Use Cases

- **Single responsibility** - one business workflow per use case
- **Dependency injection** via constructor with `Pick<>` utility types
- **Result pattern** for error handling (`Result.success()` / `Result.failure()`)
- **Interface-based dependencies** for testability

### Repository Pattern

- **Interface-based design** for testability and dependency inversion
- **Async operations** for all data access
- **Domain-focused contracts** - repositories serve domain needs

## Testing Strategy

**⚠️ TDD REQUIREMENT: Write tests BEFORE implementation code**

### Testing Principles

- **Use testing tools** for running tests (preferred over terminal commands)
- **Mock dependencies** using `vi.fn()` for unit tests
- **Test behavior, not implementation** - focus on inputs/outputs
- **Arrange-Act-Assert** pattern for test structure

### App Layer Test Types (See `app/_tests/TEST_STRATEGY.md` for complete guide)

1. **Health Tests** (`*.test.ts`): Basic service availability without dependencies
2. **Contract Tests** (`*.contract.test.ts`): API contract verification with mocked dependencies
   - Define API structure during TDD red phase
   - Use `createMockDeps()` for complete isolation
   - Tests should FAIL until handlers are implemented
3. **Integration Tests** (`*.integration.test.ts`): Multi-component workflow testing
   - Complete business scenarios across multiple endpoints
   - Test workflow consistency and data integrity
4. **E2E Tests** (`*.e2e.test.ts`): Full system testing with real implementations
   - Real repository and service instances
   - Complete authentication flows
   - Final pre-deployment verification

### Test Organization

- **Domain tests**: Entity creation, validation, and behavior (`.test.ts` alongside implementation)
- **Use case tests**: Mock dependencies and test complete workflows
- **App layer tests**: Four-tier strategy (health → contract → integration → e2e)
- **Test helpers**: Centralized mock creation in `helpers/` directory

### TDD Test Workflow

1. **Red Phase**: Write failing tests in order: Contract → Integration → E2E
2. **Green Phase**: Implement to pass tests: Domain → Use Cases → Handlers → Wiring
3. **Refactor Phase**: Improve code while all test types continue passing

## Development Workflow

### Essential Commands

- **Build**: `pnpm run typecheck`
- **Development**: `pnpm run dev`
- **Test**: Use testing tools (preferred) or `pnpm test`
- **TDD Cycle**: Write test → Run test (fail) → Implement → Run test (pass) → Refactor

### Project Structure

```text
vitafolio/
├── app/                    # Application entry point and HTTP layer
├── lib/                    # Domain and application logic
│   ├── [domain]/           # Feature-based domains (e.g., iam/)
│   │   ├── domain/         # Domain entities and value objects
│   │   │   ├── aggregates/     # Domain aggregates (root entities with invariants)
│   │   │   └── value-objects/  # Domain value objects (immutable, validated)
│   │   ├── app/            # Application use cases
│   │   ├── ports/          # Infrastructure interfaces
│   │   └── adapters/       # Infrastructure implementations
│   └── shared/             # Shared kernel and cross-cutting concerns
```

## Key Conventions

### Code Organization

- **Feature-based modules** - organize by domain/business capability
- **Test files** alongside implementation (`.test.ts` siblings)
- **Path aliases** for imports (`@shared/`, `@iam/`, etc.)

### Naming & Style

- **PascalCase** for classes and interfaces
- **camelCase** for methods, properties, and variables
- **Descriptive names** that reflect domain concepts
- **TypeScript strict mode** with ESNext modules

### Dependencies & Architecture

- **Domain layer** has no external dependencies
- **Application layer** depends only on domain and ports
- **Infrastructure** implements ports and depends on external libraries
- **Dependency inversion** - high-level modules don't depend on low-level modules

## Common Patterns to Follow

- **Static factory methods** for object creation with validation
- **Immutable data structures** with `readonly` and `Object.freeze()`
- **Interface segregation** using `Pick<>` for dependency injection
- **Result pattern** instead of throwing exceptions in business logic
- **Value objects** for domain concepts that need validation and behavior
