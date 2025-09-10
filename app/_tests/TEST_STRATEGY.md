# App Layer Test Strategy Guide

## Overview

The `app/_tests` directory contains comprehensive tests for the application's HTTP layer, following a structured testing pyramid that ensures robust API behavior and system integration. All tests follow **Test-Driven Development (TDD)** principles where tests are written **before** implementation.

## Test Types & Their Purposes

### 1. **Health Tests** (`health.test.ts`)

- **Purpose**: Basic service availability verification
- **Scope**: Minimal endpoint testing without dependencies
- **When to use**: For simple health checks and service readiness
- **Dependencies**: None (uses empty `Deps` object)

```typescript
// Example: Basic service health verification
describe("Service Health", () => {
  it("should return 200 OK", async () => {
    await supertest(app).get("/health").expect(200);
  });
});
```

### 2. **Contract Tests** (`*.contract.test.ts`)

- **Purpose**: API contract verification with mocked dependencies
- **Scope**: HTTP request/response structure validation
- **When to use**: To define and verify API contracts during TDD
- **Dependencies**: Uses `createMockDeps()` for complete isolation
- **Key Features**:
  - Mock all dependencies using `vi.fn()`
  - Focus on HTTP status codes, response structure, and data validation
  - Test error scenarios and edge cases
  - Designed to **FAIL** until actual handlers are implemented

```typescript
// Example: Contract test verifying API structure
describe("Collections Contract Tests", () => {
  beforeEach(() => {
    deps = createMockDeps(); // All dependencies mocked
    ({ app } = makeExpressApp(deps));
  });

  it("should create a new collection successfully", async () => {
    // Tests API contract - will FAIL until handler implemented
    await supertest(app)
      .post("/api/v1/collections")
      .set("Authorization", "Bearer valid_token")
      .send(newCollection)
      .expect(201)
      .expect((res) => {
        expect(res.body.success).toBe(true);
        expect(res.body.data).toMatchObject({
          id: expect.any(String),
          name: newCollection.name,
          // ... contract verification
        });
      });
  });
});
```

### 3. **Integration Tests** (`*.integration.test.ts`)

- **Purpose**: Multi-component workflow testing with realistic scenarios
- **Scope**: Business workflow validation across multiple use cases
- **When to use**: To test complex business scenarios that span multiple endpoints
- **Dependencies**: Can use either mocked or real implementations depending on test scope
- **Key Features**:
  - Test complete user workflows (e.g., create collection → add items → search)
  - Verify data consistency across operations
  - Test business logic integration
  - More complex setup and teardown

```typescript
// Example: Integration test for complete workflow
describe("Library Collection Workflow Integration", () => {
  it("should complete full library management workflow", async () => {
    // Step 1: Create a library collection
    const createResponse = await supertest(app)
      .post("/api/v1/collections")
      .send(libraryCollection)
      .expect(201);

    // Step 2: Add multiple items
    const collectionId = createResponse.body.data.id;
    // ... add items

    // Step 3: Search and verify
    // ... search functionality

    // Step 4: Update and verify consistency
    // ... update operations
  });
});
```

### 4. **End-to-End (E2E) Tests** (`*.e2e.test.ts`)

- **Purpose**: Complete system testing with real implementations
- **Scope**: Full stack testing with actual services and repositories
- **When to use**: For final verification before deployment
- **Dependencies**: Uses **real implementations** (InMemory repositories, actual services)
- **Key Features**:
  - Real repository instances (`InMemoryCollectionRepository`, etc.)
  - Real service instances (`NodeHashService`, `NodeTokenService`)
  - Complete authentication flow
  - Realistic data persistence and retrieval

```typescript
// Example: E2E test with real implementations
describe("Collections E2E Tests", () => {
  beforeEach(async () => {
    // Create REAL repository instances
    const userRepository = new InMemoryUserRepository();
    const collectionRepository = new InMemoryCollectionRepository();
    // ... other real instances

    // Create REAL use case instances with real dependencies
    const createCollection = new CreateCollection({
      collectionRepository,
    });
    // ... complete real setup
  });

  it("should handle complete collection management with authentication", async () => {
    // Real authentication flow
    const registerResult = await registerAccount.execute({
      email: "test@example.com",
      password: "password123",
    });

    // Real login and token generation
    const loginResult = await login.execute({
      email: "test@example.com",
      password: "password123",
    });

    // Use real token for API calls
    await supertest(app)
      .post("/api/v1/collections")
      .set("Authorization", `Bearer ${accessToken}`)
      .send(collectionData)
      .expect(201);
  });
});
```

## Test Helper Files

### `helpers/mockDeps.ts`

- **Purpose**: Centralized mock dependency creation
- **Provides**:
  - `createMockDeps()`: Complete dependency injection setup with mocks
  - Individual mock creators for repositories and services
  - Real use case instances with mocked dependencies

### `helpers/mockRepositories.ts`

- **Purpose**: Repository-specific mock creation utilities
- **Provides**: Individual mock repository creators with all required methods

## Decision Matrix: Which Test Type to Use?

| Scenario                               | Test Type                      | Reason                                                    |
| -------------------------------------- | ------------------------------ | --------------------------------------------------------- |
| Defining API endpoints during TDD      | **Contract**                   | Establish API contract before implementation              |
| Testing HTTP request/response format   | **Contract**                   | Focus on API structure without business logic             |
| Verifying authentication/authorization | **Contract** + **E2E**         | Contract for structure, E2E for real auth flow            |
| Testing business workflows             | **Integration**                | Multi-step scenarios with workflow validation             |
| Testing error handling                 | **Contract** + **Integration** | Contract for HTTP errors, Integration for business errors |
| Pre-deployment verification            | **E2E**                        | Final validation with real implementations                |
| Performance/load testing               | **E2E**                        | Real system behavior under load                           |
| Testing complex data scenarios         | **Integration** + **E2E**      | Both levels depending on complexity                       |

## TDD Workflow with Test Types

### 1. **Red Phase** (Write Failing Tests)

```bash
# Start with Contract tests to define API
1. Write contract test for new endpoint → FAIL (no handler)
2. Write integration test for workflow → FAIL (no use cases)
3. Write E2E test for complete scenario → FAIL (no implementation)
```

### 2. **Green Phase** (Make Tests Pass)

```bash
# Implement in order of dependency
1. Implement domain entities and use cases
2. Implement HTTP handlers to pass contract tests
3. Wire up complete flow to pass integration tests
4. Ensure E2E tests pass with real implementations
```

### 3. **Refactor Phase** (Improve While Tests Pass)

```bash
# All test types should continue passing
1. Refactor with confidence - tests catch regressions
2. Add edge cases as contract tests
3. Add performance scenarios as E2E tests
```

## Best Practices

### Test Organization

- **One test file per feature/endpoint group**
- **Descriptive test names** that explain the scenario
- **Consistent setup/teardown** using `beforeEach`/`afterEach`
- **Group related tests** using nested `describe` blocks

### Test Data Management

- **Use realistic test data** that reflects actual usage
- **Create reusable test data builders** for complex objects
- **Isolate test data** - each test should be independent
- **Clean up after tests** to prevent side effects

### Assertion Patterns

```typescript
// Good: Specific assertions
expect(response.body.data).toMatchObject({
  id: expect.any(String),
  name: "Expected Name",
  createdAt: expect.any(String),
});

// Good: Error scenario testing
await supertest(app)
  .post("/api/v1/collections")
  .send(invalidData)
  .expect(400)
  .expect((res) => {
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBeDefined();
  });
```

### Authentication Testing

```typescript
// Pattern for testing protected endpoints
describe("Protected endpoint", () => {
  it("should require authentication", async () => {
    await supertest(app).get("/api/v1/protected").expect(401); // No auth header
  });

  it("should reject invalid tokens", async () => {
    await supertest(app)
      .get("/api/v1/protected")
      .set("Authorization", "Bearer invalid_token")
      .expect(401);
  });

  it("should allow valid tokens", async () => {
    await supertest(app)
      .get("/api/v1/protected")
      .set("Authorization", `Bearer ${validToken}`)
      .expect(200);
  });
});
```

## Running Tests

### Preferred Method (Using Testing Tools)

```bash
# Use VS Code testing tools for better integration
# This is preferred over terminal commands
```

### Command Line (Alternative)

```bash
# All tests
pnpm test

# Specific test file
pnpm test collections.contract.test.ts

# Watch mode during development
pnpm test --watch

# Coverage reporting
pnpm test --coverage
```

## Common Pitfalls to Avoid

1. **Don't write tests after implementation** - Always TDD
2. **Don't test implementation details** - Test behavior and contracts
3. **Don't create brittle tests** - Use flexible matchers like `expect.any(String)`
4. **Don't ignore failing tests** - Fix or update immediately
5. **Don't mix test types** - Keep contract, integration, and E2E concerns separate
6. **Don't share state between tests** - Ensure test isolation
7. **Don't forget edge cases** - Test error conditions and boundary values

## Integration with Development Workflow

1. **Feature Development**: Start with contract tests to define API
2. **Implementation**: Write use cases and handlers to pass tests
3. **Integration**: Add integration tests for complex workflows
4. **Validation**: Run E2E tests before merging
5. **Deployment**: All test types should pass before production release

This testing strategy ensures robust, maintainable code that follows TDD principles while providing comprehensive coverage at multiple levels of the application stack.
