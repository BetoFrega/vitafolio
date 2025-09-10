# Route Architecture Improvement - Work In Progress

## 🎯 Current Status: Phase 1 Foundation Complete

**Objective**: Implement clean route architecture with standardized response formats and class-based handlers

**Strategy**:

- ✅ Breaking changes acceptable (system in dev)
- ✅ TDD approach throughout
- ✅ Keep all tests green during implementation
- ✅ Follow improvements.md specification exactly

---

## ✅ COMPLETED TASKS

### ✅ Task 1.1 - Response Type Definitions (COMPLETED)

**Key Achievement**: Avoided overengineering - chose simple type definitions over utility classes

**What we built**:

```typescript
// Core response types
interface ApiError {
  code: string;
  message: string;
}
interface SuccessResponse<T> {
  success: true;
  data: T;
  timestamp: string;
}
interface ErrorResponse {
  success: false;
  error: ApiError;
  timestamp: string;
}
type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;
```

**Key Decisions**:

- ✅ NO utility classes (initially overengineered this)
- ✅ Response creation logic belongs in BaseHandler methods
- ✅ Type definitions provide compile-time safety
- ✅ 4 passing tests for type validation

### ✅ Task 1.2 - BaseHandler Foundation (COMPLETED)

**Key Achievement**: Proper abstract class design with class-level generics

**What we built**:

```typescript
export abstract class BaseHandler<T = unknown> {
  abstract handle(req: Request, res: Response): Promise<void>;
  protected sendSuccess(res: Response, data: T, status = 200): void;
  protected sendError(res: Response, error: ApiError, status = 400): void;
}
```

**Key Improvements Made**:

- ✅ Used proper response types from Task 1.1 (consistency)
- ✅ Moved generic `<T>` from method to class level (better OOP design)
- ✅ 10 passing tests with comprehensive coverage
- ✅ Abstract class forces concrete implementations

**Example Usage**:

```typescript
class CreateItemHandler extends BaseHandler<ItemData> {
  async handle(req: Request, res: Response): Promise<void> {
    // this.sendSuccess(res, itemData) - T automatically inferred as ItemData
  }
}
```

### ✅ Task 1.3 - AuthenticatedHandler (COMPLETED)

**Key Achievement**: Automatic authentication handling with proper delegation pattern

**What we built**:

```typescript
export abstract class AuthenticatedHandler<T = unknown> extends BaseHandler<T> {
  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.extractUserId(req);
    if (!userId) return this.sendUnauthorizedError(res);
    return this.handleAuthenticated(req, res, userId);
  }

  protected abstract handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void>;
}
```

**Key Features**:

- ✅ Automatic user ID extraction and validation
- ✅ Standardized unauthorized error responses (401 status, "UNAUTHORIZED" code)
- ✅ Clean delegation to `handleAuthenticated()` method
- ✅ Type-safe `AuthenticatedRequest` interface matching auth middleware
- ✅ 8 passing tests covering all authentication scenarios
- ✅ Proper inheritance from BaseHandler with full access to response methods

**Example Usage**:

```typescript
class CreateCollectionHandler extends AuthenticatedHandler<CollectionData> {
  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    // userId is guaranteed to exist and be valid
    // this.sendSuccess(res, collectionData) or this.sendError(res, error)
  }
}
```

### ✅ Task 1.4 - Request Validation System (COMPLETED)

**Key Achievement**: Clean validation utilities with proper scope - no premature route-specific schemas

**What we built**:

```typescript
export class RequestValidator {
  static validate<T>(schema: z.ZodSchema<T>, data: unknown): Result<T>;
  static validateBody<T>(
    schema: z.ZodSchema<T>,
    req: { body?: unknown },
  ): Result<T>;
  static validateParams<T>(
    schema: z.ZodSchema<T>,
    req: { params?: Record<string, string> },
  ): Result<T>;
  static validateQuery<T>(
    schema: z.ZodSchema<T>,
    req: { query?: Record<string, string> },
  ): Result<T>;
}
```

**Key Features**:

- ✅ Integration with existing Result pattern from shared contracts
- ✅ Type-safe validation using Zod schemas
- ✅ Standardized ValidationError for consistent error handling
- ✅ Request-specific validation methods (body, params, query)
- ✅ 13 passing tests for RequestValidator utility
- ✅ Only truly generic schemas: Pagination, UuidParam, SlugParam (7 passing tests)
- ✅ Route-specific schemas will be defined alongside their routes (correct architecture)

**Example Usage**:

```typescript
class CreateItemHandler extends AuthenticatedHandler<ItemData> {
  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    const validationResult = RequestValidator.validateBody(
      CreateItemSchema,
      req,
    );
    if (validationResult.isFailure()) {
      return this.sendError(
        res,
        {
          code: "VALIDATION_ERROR",
          message: validationResult.getError().message,
        },
        400,
      );
    }
    // Process validated data: validationResult.getValue()
  }
}
```

### ✅ Task 2.1 - Health Routes Module (Pilot) (COMPLETED)

**Key Achievement**: First successful implementation of new modular route architecture

**What we built**:

```typescript
// HealthHandler using new BaseHandler pattern
export class HealthHandler extends BaseHandler<HealthData> {
  async handle(req: Request, res: Response): Promise<void> {
    const healthData: HealthData = { ok: true };
    this.sendSuccess(res, healthData, 200);
  }
}

// buildHealthRoutes module function
export function buildHealthRoutes(): express.Router {
  const router = express.Router();
  const healthHandler = new HealthHandler();
  router.get("/health", async (req, res) => {
    await healthHandler.handle(req, res);
  });
  return router;
}
```

**Key Implementation Steps (TDD)**:

1. ✅ **RED**: Wrote failing tests for HealthHandler class (4 tests)
2. ✅ **GREEN**: Implemented HealthHandler extending BaseHandler
3. ✅ **RED**: Wrote failing tests for health module router (4 tests)
4. ✅ **GREEN**: Implemented buildHealthRoutes function
5. ✅ **RED**: Wrote failing integration tests with Express app (3 tests)
6. ✅ **GREEN**: Created supertest integration tests (3 tests)
7. ✅ **RED**: Wrote failing main routes integration tests (3 tests)
8. ✅ **GREEN**: Updated main routes/index.ts to use new health module
9. ✅ **REFACTOR**: All 14 health tests passing, full test suite green (131 tests)

**Key Features**:

- ✅ **Standardized response format**: `{ success: true, data: { ok: true }, timestamp: "..." }`
- ✅ **Modular architecture**: Health routes in `/app/http/express/routes/health/`
- ✅ **Class-based handler**: HealthHandler extends BaseHandler pattern
- ✅ **TDD implementation**: All code written after failing tests
- ✅ **Zero regression**: All existing tests still pass
- ✅ **Integration verified**: Works with main Express app routing

**Breaking Change Implemented**:

- **OLD FORMAT**: `{ ok: true }`
- **NEW FORMAT**: `{ success: true, data: { ok: true }, timestamp: "2025-..." }`
- **Backward compatibility**: Health data still contains `{ ok: true }` in `data` field

**File Structure Created**:

```text
app/http/express/routes/health/
├── HealthHandler.ts              # Handler class
├── HealthHandler.test.ts         # Unit tests (4 tests)
├── index.ts                      # Module router
├── index.test.ts                 # Router tests (4 tests)
├── health.integration.test.ts    # Integration tests (3 tests)
└── main-routes.integration.test.ts # Main app integration (3 tests)
```

---

## 🔄 CURRENT TASK: Phase 2, Task 2.2 - Auth Routes Module

**Objective**: Migrate authentication routes (login, register) to new modular architecture

**🚨 CRITICAL: E2E Test Requirements**

- **ALL routes must have E2E test coverage** - this is mandatory
- **E2E tests must be written BEFORE implementation** (TDD requirement)
- Current missing E2E coverage that MUST be added:
  - ✅ GET /health → **COMPLETED** (`health.e2e.test.ts` with 6 tests)
  - ❌ GET /debug/auth → **REQUIRED for auth module**
  - ❌ GET /api/v1/notifications → **Currently skipped, must enable**
  - ❌ GET /api/v1/items/search → **Missing search E2E tests**

**TDD Implementation Plan**:

1. ⏳ **E2E Tests First (RED Phase)**:
   - Create `auth.e2e.test.ts` with tests for login, register, debug/auth endpoints
   - ✅ Create `health.e2e.test.ts` for health endpoint (**COMPLETED** - 6 passing tests)
   - Run tests - should FAIL (RED phase)

2. ⏳ **Analysis & Design**:
   - Analyze existing auth handlers (makeLoginHandler, makeUserRegistrationHandler)
   - Write unit tests for auth handler classes

3. ⏳ **Implementation (GREEN Phase)**:
   - Test auth module router setup
   - Implement auth handlers and router following new patterns
   - Integration test with Express app
   - All tests should PASS (GREEN phase)

4. ⏳ **Refactor Phase**:
   - Improve code while keeping all tests green

**🎯 Success Criteria**:

- All auth routes have E2E test coverage
- Health endpoint has E2E test coverage
- No regression in existing functionality
- Follow new architecture patterns established in health module

---

## 📋 UPCOMING TASKS### Task 1.4 - Request Validation System

- RequestValidator utility with zod integration
- Error handling for validation failures

### Phase 2 - Feature Organization

- Health routes module (pilot implementation)
- Auth routes module
- Collections module structure

### Phase 3 - Handler Migration

- Convert existing factory functions to class handlers
- Fix tests during migration
- Maintain API compatibility

---

## 🧠 KEY INSIGHTS & LESSONS LEARNED

### Design Decisions That Worked Well:

1. **Simple type definitions over utility classes** - Much cleaner, less cognitive overhead
2. **Class-level generics in BaseHandler** - Proper OOP design, better type safety
3. **Response logic in BaseHandler methods** - Exactly matches improvements.md spec
4. **TDD approach** - Caught design issues early (like overengineering)

### Important Reminders:

- **E2E test coverage is MANDATORY for ALL routes** - documented in `/app/_tests/TEST_STRATEGY.md`
- **TDD approach with E2E tests first** - write E2E tests BEFORE implementing new modules
- **Health endpoint special case**: Returns `{ ok: true }` in data field with standardized wrapper
- **Authentication middleware**: Located at `/app/http/express/middleware/makeAuthenticationMiddleware.ts`
- **Result pattern**: Use `result.isSuccess()`, `result.getValue()`, etc. (NOT just static methods)
- **Current E2E coverage gaps**: health, debug/auth, notifications (skipped), search routes

### E2E Test Coverage Status:

- ✅ **Covered**: register, login, collections, items CRUD, **health**
- ❌ **Missing**: debug/auth, notifications, search
- 📝 **Action Required**: Create missing E2E tests before proceeding with new modules

### Architecture Constraints:

- **No path changes** in this phase - keep `/api/v1/` structure
- **Gradual migration** - old and new handlers will coexist temporarily
- **All tests must pass** - fix broken tests immediately during migration

---

## 🚨 BREAKING CHANGES TO MONITOR

**Inevitable Response Format Changes**:

- Old handlers use inconsistent formats: `{ error: "message" }` vs `{ success: false, error: {...} }`
- Will need to fix tests gradually as we migrate each handler
- Document each breaking change for future reference

**Areas Requiring Special Attention**:

- User registration handler (simple message response)
- Health check (unique `{ ok: true }` format)
- Error responses across different handlers (inconsistent structures)

---

_Last Updated: After completing BaseHandler with proper class-level generics and type integration_

I need to make sure I check app/http/express/routes/improvements-tasks.md and app/http/express/routes/improvements.md for any additional details or requirements.
