# Vitafolio - AI Coding Agent Instructions

## ⚠️ REQUIRED: English Language Standard

**ALL PROJECT ARTIFACTS MUST BE WRITTEN IN ENGLISH:**

- **Code**: Variables, functions, classes, interfaces, comments
- **Documentation**: All markdown files, README, API docs
- **Tests**: Test descriptions, file names, error messages
- **Git**: Commit messages, branch names, PR descriptions
- **Configuration**: Config files, scripts, environment variables

_Note: Human communication with AI may be in any language, but all generated content must be in English._

## ⚠️ REQUIRED: Test-Driven Development (TDD)

**ALL CODE CHANGES MUST FOLLOW TDD PRINCIPLES:**

1. **Red**: Write a failing test first before implementing any code
2. **Green**: Write minimal code to make the test pass
3. **Refactor**: Improve code while keeping tests passing

### TDD Workflow Requirements:

- **Never write production code without a failing test**
- **Tests must be written BEFORE implementation**
- **Run tests frequently** using the available test tool (NOT terminal commands) to ensure nothing breaks
- **All tests must pass** before committing changes
- **Test file names**:
  - Domain/Use Case tests: `.test.ts` alongside implementation files
  - App layer tests: `*.integration.test.ts`, `*.e2e.test.ts`
- **Test type selection**:
  - Integration tests: Test business workflows and API behavior
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

- **Use the test tool** for running tests - do NOT use terminal commands like `pnpm test` or `vitest run`. If the test tool is not available, please notify the team to set it up.
- **Follow the Test Pyramid** - Many unit tests, some integration tests, few E2E tests
- **Mock dependencies** using `vi.fn()` for unit tests
- **Test behavior, not implementation** - focus on inputs/outputs
- **Arrange-Act-Assert** pattern for test structure

### Test Pyramid Strategy

Following the test pyramid for optimal speed, reliability, and maintainability:

#### **1. Unit Tests (70-80% of tests)** - `*.test.ts`

- **Domain entities and value objects** - Test creation, validation, and business logic
- **Use case logic** - Test with mocked dependencies
- **Pure functions** - Test isolated business logic
- **Fast execution** (milliseconds) and **low maintenance cost**

#### **2. Integration Tests (15-25% of tests)** - `*.integration.test.ts`

- **Multi-component workflows** - Test use cases with real dependencies where feasible
- **Business scenario validation** - Complete workflows across multiple components
- **Data flow integrity** - Ensure proper data transformation between layers
- **Moderate execution speed** (seconds) and **medium maintenance cost**

#### **3. E2E Tests (5-10% of tests)** - `*.e2e.test.ts`

- **Complete user flows** - Full system testing with real implementations
- **HTTP API endpoints** - Test authentication, authorization, and complete request/response cycles
- **Critical path validation** - Essential business workflows only
- **Slower execution** (minutes) but **high confidence in system behavior**

### Test Organization

- **Domain tests**: Entity creation, validation, and behavior (`.test.ts` alongside implementation)
- **Use case tests**: Mock dependencies and test complete workflows
- **App layer tests**: Three-tier strategy (unit → integration → e2e)
- **Test helpers**: Centralized mock creation in `helpers/` directory

### TDD Test Workflow

1. **Red Phase**: Write failing tests in order: Integration → E2E
2. **Green Phase**: Implement to pass tests: Domain → Use Cases → Handlers → Wiring
3. **Refactor Phase**: Improve code while all test types continue passing

## Development Workflow

### Essential Commands

- **Build**: `pnpm run typecheck`
- **Development**: `pnpm run dev`
- **Test**: Use the test tool (do NOT use `pnpm test` or other terminal commands)
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
