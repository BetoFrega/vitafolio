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

---

## 🔄 CURRENT TASK: Phase 2, Task 2.1 - Health Routes Module (Pilot)

**Objective**: Migrate health check to new architecture as pilot implementation

**TDD Implementation Plan**:

1. ⏳ Analyze existing health check endpoint structure
2. ⏳ Write tests for health route handler class
3. ⏳ Test health module router setup
4. ⏳ Implement health handler and router following new patterns
5. ⏳ Integration test with Express app

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

- **Health endpoint special case**: Returns `{ ok: true }` - decide whether to standardize later
- **Authentication middleware**: Located at `/app/http/express/middleware/makeAuthenticationMiddleware.ts`
- **Result pattern**: Use `result.isSuccess()`, `result.getValue()`, etc. (NOT just static methods)

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
