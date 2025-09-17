# Vitafolio Constitution

## Core Principles

### I. Clean Architecture (NON-NEGOTIABLE)

Clean Architecture pattern strictly enforced with clear layer separation:

- **Domain layer**: Pure business logic, no external dependencies. Value Objects (VOs) are strictly immutable (private constructors, static factories, readonly properties). Aggregates and Aggregate Roots are mutable, with public command methods that mutate internal state and validate invariants. No universal immutability for aggregates.
- **Application layer**: Use cases implementing business workflows, dependency injection via Pick<> utility types
- **Infrastructure layer**: Adapters implementing ports, external dependencies isolated here
- **Dependency rule**: Inner layers never depend on outer layers

### II. Test-Driven Development (NON-NEGOTIABLE)

TDD mandatory with Red-Green-Refactor cycle strictly enforced:

- **Red**: Write failing test first before any production code
- **Green**: Write minimal code to make test pass
- **Refactor**: Improve code while keeping tests passing
- **No production code without failing test first**
- **Test files**: Always create `.test.ts` files alongside implementation files

### III. Domain-Driven Design

Rich domain models with behavior and validation:

- **Value Objects (VOs)**: Strictly immutable, identified by values not identity, private constructors, static factory methods, all properties readonly, no mutating methods. Any change returns a new VO.
- **Aggregates & Aggregate Roots**: Mutable state, stable identity, public command methods mutate internal state and validate invariants, no recreation of aggregate on command, only business methods exposed, no generic setters. Internal state is not directly mutable from outside the aggregate; fields are private and exposed via read-only accessors.
- **Aggregates**: Consistency boundaries with invariant enforcement.
- **Ubiquitous language**: Code reflects business terminology exactly.

### IV. Result Pattern Error Handling

Explicit error handling without exceptions in business logic:

- **Use Result<T, E>** for all operations that can fail
- **Result.success()** for successful operations
- **Result.failure()** for failures with descriptive error types
- **No throwing exceptions** in domain or application layers

### V. Interface-Based Design

Dependency inversion through abstractions:

- **Repository interfaces** define domain needs, not implementation details
- **Port interfaces** for all external dependencies
- **Async operations** for all data access
- **Mock dependencies** using vi.fn() for isolated unit tests

### VI. English Language Standard (NON-NEGOTIABLE)

All project artifacts must be written in English:

- **Code**: Variable names, function names, class names, comments
- **Documentation**: README files, API docs, architecture documents
- **Tests**: Test descriptions, test file names, error messages
- **Git commits**: Commit messages and branch names
- **Configuration**: Config files, environment variables, scripts

_Note: Human communication with AI assistants may be in any language, but all generated artifacts must be in English._

## Development Standards

### Code Quality Requirements

- **TypeScript strict mode** with ESNext modules and noEmit type checking
- **Path aliases** for clean imports (@shared/, @iam/, @domain/)
- **Feature-based organization** by domain/business capability
- **Immutable data structures for VOs only**: Use `readonly` for Value Objects. Aggregates are mutable and should not use universal immutability.
- **PascalCase** for classes/interfaces, **camelCase** for methods/properties

### Aggregate Encapsulation Rules

- All aggregate fields MUST be `private` and mutated only by domain-specific command methods.
- Expose read-only views: getters may return primitives or read-only views (`ReadonlyArray<T>`, `ReadonlyMap<K,V>`), never direct mutable references.
- Use defensive copies when returning complex structures to prevent outside mutation.
- Validate invariants before any mutation and optionally raise domain events or return a `Result`.

### Testing Standards

- **Arrange-Act-Assert** pattern for all test structure
- **Test behavior not implementation** - focus on inputs/outputs
- **Integration tests** for cross-component workflows
- **Testing tools preferred** over terminal commands for test execution
- **All tests must pass** before any code commit

## Technology Constraints

### Core Technology Stack

- **Runtime**: Node.js >=24.0.0 with TypeScript strict mode
- **Package manager**: pnpm with workspace support
- **Testing**: Vitest with vi.fn() mocking for unit tests
- **Build tools**: tsx for development, tsc for type checking
- **HTTP layer**: Express.js for REST API endpoints when needed

### Architecture Enforcement

- **No circular dependencies** between layers or modules
- **Single responsibility** principle for all classes and use cases
- **Dependency injection** through constructor parameters only
- **No direct database access** from domain or application layers
- **Port/adapter pattern** for all external integrations

## Governance

Constitution supersedes all other development practices and must be followed without exception. All code reviews must verify compliance with these principles. Complexity that violates these rules must be justified and approved before implementation.

Any amendments to this constitution require:

1. Documentation of the change rationale
2. Update of all dependent templates and documentation
3. Migration plan for existing code if needed
4. Team approval before implementation

Refer to `.github/copilot-instructions.md` for detailed runtime development guidance and implementation patterns.

**Version**: 1.0.0 | **Ratified**: September 9, 2025 | **Last Amended**: September 9, 2025
