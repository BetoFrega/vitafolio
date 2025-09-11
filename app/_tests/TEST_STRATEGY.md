# App Layer Test Strategy Guide

## Overview

The `app/_tests` directory contains comprehensive tests for the application's HTTP layer, following a structured testing pyramid that ensures robust API behavior and system integration. All tests follow **Test-Driven Development (TDD)** principles where tests are written **before** implementation.

## ⚠️ CRITICAL: E2E Test Coverage Requirement

**EVERY ROUTE MUST HAVE E2E TEST COVERAGE**

All API endpoints must have corresponding E2E tests that verify complete system behavior with real implementations. This is mandatory for:

- ✅ **Existing routes** - All current routes must have E2E coverage
- ✅ **New route modules** - E2E tests must be written BEFORE implementing new modules (TDD)
- ✅ **Modified routes** - Any route changes must update corresponding E2E tests

### Current E2E Coverage Status:

**✅ Covered Routes:**

- POST /register (in collections.e2e.test.ts)
- POST /login (in collections.e2e.test.ts)
- Collections routes (collections.e2e.test.ts, collections-advanced.e2e.test.ts)
- Items routes (items.e2e.test.ts, collections.e2e.test.ts)

**❌ Missing E2E Coverage (MUST BE ADDED):**

- GET /health ❌ **REQUIRED**
- GET /debug/auth ❌ **REQUIRED**
- GET /api/v1/notifications ❌ **REQUIRED** (test exists but skipped)
- GET /api/v1/items/search ❌ **REQUIRED**

**📝 Action Required:** Before implementing any new route modules, ensure corresponding E2E tests are written first.

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

### 2. **Integration Tests** (`*.integration.test.ts`)

**There are TWO types of integration tests with different purposes:**

#### 2a. **Module Integration Tests** (`module-name.integration.test.ts`)

- **Purpose**: Test a specific route module in isolation
- **Scope**: Single module functionality without full app context
- **Example**: `health.integration.test.ts` tests only the health module
- **When to use**: To verify module-specific behavior and contracts

```typescript
// Example: Module integration test
describe("Health Routes Integration", () => {
  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mount ONLY the health routes module
    const healthRouter = buildHealthRoutes();
    app.use(healthRouter);
  });

  it("should return health status with standardized response format", async () => {
    const response = await request(app).get("/health").expect(200);
    // Test module-specific behavior
  });
});
```

#### 2b. **App Integration Tests** (`app-*.integration.test.ts` or `main-*.integration.test.ts`)

- **Purpose**: Test modules working together in full app context
- **Scope**: Multi-module integration within complete application setup
- **Example**: `main-routes.integration.test.ts` tests health module with full route setup
- **When to use**: To verify modules work correctly when integrated with the complete app

```typescript
// Example: App integration test
describe("Main Routes Integration with Health Module", () => {
  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Mount FULL app routes including all modules
    const mainRouter = buildRoutes(mockDeps);
    app.use(mainRouter);
  });

  it("should respond to GET /health with new standardized format", async () => {
    // Test that health module works in full app context
  });
});
```

### 3. **End-to-End (E2E) Tests** (`*.e2e.test.ts`)

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
  - `createMockDeps()`: Dependency setup with real use cases and mocked repositories
  - Individual mock creators for repositories and services

### `helpers/mockRepositories.ts`

- **Purpose**: Repository-specific mock creation utilities
- **Provides**: Individual mock repository creators with all required methods

## Decision Matrix: Which Test Type to Use?

| Scenario                               | Test Type                 | Reason                                                |
| -------------------------------------- | ------------------------- | ----------------------------------------------------- |
| Defining API endpoints during TDD      | **Integration**           | Establish API behavior with business logic            |
| Testing HTTP request/response format   | **Integration**           | Focus on API structure with actual use cases          |
| Verifying authentication/authorization | **Integration** + **E2E** | Integration for auth flow, E2E for complete scenarios |
| Testing business workflows             | **Integration**           | Multi-step scenarios with workflow validation         |
| Testing error handling                 | **Integration**           | Business logic and HTTP error handling together       |
| Pre-deployment verification            | **E2E**                   | Final validation with real implementations            |
| Performance/load testing               | **E2E**                   | Real system behavior under load                       |
| Testing complex data scenarios         | **Integration** + **E2E** | Both levels depending on complexity                   |

## TDD Workflow with Test Types

### 1. **Red Phase** (Write Failing Tests)

```bash
# Start with Integration tests to define API behavior and business logic
1. Write integration test for workflow → FAIL (no use cases implemented)
2. Write E2E test for complete scenario → FAIL (no complete implementation)
```

### 2. **Green Phase** (Make Tests Pass)

```bash
# Implement in order of dependency
1. Implement domain entities and use cases → Integration tests pass
2. Wire up real implementations → E2E tests pass
3. All test types should now pass with real functionality
```

### 3. **Refactor Phase** (Improve While Tests Pass)

```bash
# All test types should continue passing
1. Refactor with confidence - tests catch regressions
2. Add edge cases as integration tests
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

## TDD Workflow for New Route Modules

When implementing new route modules (like auth, collections, etc.), follow this **MANDATORY** TDD sequence:

### Phase 1: E2E Tests First (RED)

```bash
# 1. Create E2E test for new route module
app/_tests/e2e/new-module.e2e.test.ts

# 2. Write comprehensive E2E tests for ALL endpoints in the module
# 3. Run tests - they should FAIL (RED phase)
pnpm test app/_tests/e2e/new-module.e2e.test.ts
```

### Phase 2: Implementation (GREEN)

```bash
# 4. Implement route module following architecture patterns
app/http/express/routes/new-module/

# 5. Write unit tests for handlers
# 6. Write module integration tests
# 7. Write app integration tests
# 8. Implement handlers and router
# 9. All tests should PASS (GREEN phase)
```

### Phase 3: Refactor

```bash
# 10. Improve code while keeping all tests green
# 11. Ensure E2E tests still pass after refactoring
```

## E2E Test Coverage Tracking

Track E2E coverage for all routes in this section:

### ✅ Routes with E2E Coverage

- `POST /register` → `collections.e2e.test.ts`
- `POST /login` → `collections.e2e.test.ts`
- `POST /api/v1/collections` → `collections.e2e.test.ts`
- `GET /api/v1/collections` → `collections.e2e.test.ts`
- `GET /api/v1/collections/:id` → `collections.e2e.test.ts`
- `PUT /api/v1/collections/:id` → `collections-advanced.e2e.test.ts`
- `DELETE /api/v1/collections/:id` → `collections-advanced.e2e.test.ts`
- `POST /api/v1/collections/:id/items` → `collections.e2e.test.ts`
- `GET /api/v1/collections/:id/items` → `collections.e2e.test.ts`
- `GET /api/v1/items/:id` → `items.e2e.test.ts`
- `PUT /api/v1/items/:id` → `collections-advanced.e2e.test.ts`
- `DELETE /api/v1/items/:id` → `collections-advanced.e2e.test.ts`

### ❌ Routes Missing E2E Coverage (ACTION REQUIRED)

- `GET /health` → **MUST CREATE: `health.e2e.test.ts`**
- `GET /debug/auth` → **MUST CREATE: `auth.e2e.test.ts` or add to existing**
- `GET /api/v1/notifications` → **MUST ENABLE: `notifications.e2e.test.ts` (currently skipped)**
- `GET /api/v1/items/search` → **MUST CREATE: `search.e2e.test.ts` or add to items**

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
pnpm test collections.integration.test.ts

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
5. **Don't mix test types** - Keep integration and E2E concerns separate
6. **Don't share state between tests** - Ensure test isolation
7. **Don't forget edge cases** - Test error conditions and boundary values

## Integration with Development Workflow

1. **Feature Development**: Start with integration tests to define API behavior
2. **Implementation**: Write use cases and handlers to pass tests
3. **Integration**: Add more complex integration tests for workflows
4. **Validation**: Run E2E tests before merging
5. **Deployment**: All test types should pass before production release

This testing strategy ensures robust, maintainable code that follows TDD principles while providing comprehensive coverage at multiple levels of the application stack.
