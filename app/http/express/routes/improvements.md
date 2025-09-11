# Routes Architecture Improvements

## Current Issues

### 1. **Mixed Responsibilities in Single Directory**

- All route handlers (16+ files) are in one flat directory
- Factory functions, business logic, and routing logic are mixed together
- No clear separation between different types of handlers (auth, collections, health, etc.)

### 2. **Inconsistent Handler Patterns**

- Some handlers use direct use case injection (`AddItemToCollection`)
- Others use full deps object with property access (`deps.createCollection`)
- Inconsistent error handling and response formatting across handlers

### 3. **Repetitive Code**

- Authentication checks duplicated across multiple handlers
- Error response formatting duplicated (status codes, response structure)
- Validation logic scattered and repeated

### 4. **Poor Discoverability**

- Hard to find related handlers (e.g., all collection-related routes)
- No clear naming conventions for grouping
- Index file becomes a massive import list

### 5. **Testing Challenges**

- Each handler factory needs separate testing setup
- No shared testing utilities for common patterns
- Difficult to test route groups in isolation

## Proposed Architecture Improvements

### 1. **Feature-Based Route Organization**

```text
routes/
├── index.ts                    # Main router assembly
├── shared/                     # Shared utilities and middleware
│   ├── handlers/              # Base handler utilities
│   │   ├── BaseHandler.ts     # Abstract base handler
│   │   ├── AuthenticatedHandler.ts
│   │   └── ValidationHandler.ts
│   ├── responses/             # Standardized response helpers
│   │   ├── ApiResponse.ts
│   │   ├── ErrorResponse.ts
│   │   └── SuccessResponse.ts
│   └── validation/            # Request validation utilities
│       ├── RequestValidator.ts
│       └── schemas/
├── health/                    # Health check routes
│   ├── index.ts
│   └── HealthHandler.ts
├── auth/                      # Authentication routes
│   ├── index.ts
│   ├── LoginHandler.ts
│   └── RegisterHandler.ts
└── collections/               # Collection management routes
    ├── index.ts               # Collection router
    ├── handlers/              # Collection-specific handlers
    │   ├── CreateCollectionHandler.ts
    │   ├── GetCollectionHandler.ts
    │   ├── UpdateCollectionHandler.ts
    │   ├── DeleteCollectionHandler.ts
    │   └── ListCollectionsHandler.ts
    ├── items/                 # Item sub-routes
    │   ├── index.ts
    │   └── handlers/
    │       ├── CreateItemHandler.ts
    │       ├── GetItemHandler.ts
    │       ├── UpdateItemHandler.ts
    │       ├── DeleteItemHandler.ts
    │       ├── ListItemsHandler.ts
    │       └── SearchItemsHandler.ts
    └── notifications/
        ├── index.ts
        └── handlers/
            └── ListNotificationsHandler.ts
```

### 2. **Standardized Handler Base Classes**

#### BaseHandler Pattern

```typescript
// shared/handlers/BaseHandler.ts
export abstract class BaseHandler<TRequest = unknown, TResponse = unknown> {
  abstract handle(req: Request, res: Response): Promise<void>;

  protected sendSuccess<T>(res: Response, data: T, status = 200): void {
    res.status(status).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  }

  protected sendError(res: Response, error: ApiError, status = 400): void {
    res.status(status).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
```

#### AuthenticatedHandler Pattern

```typescript
// shared/handlers/AuthenticatedHandler.ts
export abstract class AuthenticatedHandler<
  TRequest = unknown,
  TResponse = unknown,
> extends BaseHandler<TRequest, TResponse> {
  async handle(req: AuthenticatedRequest, res: Response): Promise<void> {
    const userId = this.extractUserId(req);
    if (!userId) {
      return this.sendUnauthorizedError(res);
    }

    return this.handleAuthenticated(req, res, userId);
  }

  protected abstract handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void>;

  private extractUserId(req: AuthenticatedRequest): string | null {
    return req.user?.id || null;
  }

  private sendUnauthorizedError(res: Response): void {
    this.sendError(
      res,
      {
        code: "UNAUTHORIZED",
        message: "Authentication required",
      },
      401,
    );
  }
}
```

### 3. **Request Validation System**

```typescript
// shared/validation/RequestValidator.ts
export class RequestValidator {
  static validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
  ): Result<T, ValidationError> {
    const result = schema.safeParse(data);
    if (!result.success) {
      return Result.failure(new ValidationError(result.error.message));
    }
    return Result.success(result.data);
  }
}

// collections/handlers/CreateCollectionHandler.ts
export class CreateCollectionHandler extends AuthenticatedHandler {
  constructor(private createCollection: CreateCollection) {
    super();
  }

  protected async handleAuthenticated(
    req: AuthenticatedRequest,
    res: Response,
    userId: string,
  ): Promise<void> {
    const validationResult = RequestValidator.validate(
      CreateCollectionSchema,
      req.body,
    );

    if (validationResult.isFailure()) {
      return this.sendError(res, validationResult.error, 400);
    }

    const { name, description, metadataSchema } = validationResult.value;

    const result = await this.createCollection.execute({
      name,
      description,
      ownerId: userId,
      metadataSchema,
    });

    if (result.isFailure()) {
      return this.sendError(res, result.error, 400);
    }

    this.sendSuccess(res, result.value, 201);
  }
}
```

### 4. **Feature Router Pattern**

```typescript
// collections/index.ts
export function buildCollectionsRouter(deps: CollectionDeps): Router {
  const router = express.Router();

  // Collection CRUD
  router.post("/", new CreateCollectionHandler(deps.createCollection).handle);
  router.get("/", new ListCollectionsHandler(deps.listCollections).handle);
  router.get("/:id", new GetCollectionHandler(deps.getCollection).handle);
  router.put("/:id", new UpdateCollectionHandler(deps.updateCollection).handle);
  router.delete(
    "/:id",
    new DeleteCollectionHandler(deps.deleteCollection).handle,
  );

  // Items sub-router
  router.use("/:collectionId/items", buildItemsRouter(deps));

  // Notifications sub-router
  router.use("/:collectionId/notifications", buildNotificationsRouter(deps));

  return router;
}

// Main routes/index.ts
export function buildRoutes(
  deps: Deps,
  authMiddleware?: RequestHandler,
): Router {
  const router = express.Router();

  // Public routes
  router.use("/health", buildHealthRouter(deps));
  router.use("/auth", buildAuthRouter(deps));

  // Protected routes
  if (authMiddleware) {
    router.use("/collections", authMiddleware, buildCollectionsRouter(deps));
  }

  return router;
}
```

### 5. **Dependency Injection Improvements**

```typescript
// Use specific dependency interfaces for each feature
interface CollectionDeps {
  createCollection: CreateCollection;
  listCollections: ListCollections;
  getCollection: GetCollection;
  updateCollection: UpdateCollection;
  deleteCollection: DeleteCollection;
  // Item-related dependencies
  createItem: CreateItem;
  listItems: ListItems;
  // ... etc
}

interface AuthDeps {
  registerAccount: RegisterAccount;
  login: Login;
}
```

## Implementation Benefits

### 1. **Better Code Organization**

- Clear feature boundaries and responsibilities
- Easy to locate related functionality
- Reduced cognitive load when working on specific features

### 2. **Reduced Duplication**

- Shared base classes eliminate repetitive authentication and error handling
- Standardized response formats across all endpoints
- Centralized validation logic

### 3. **Improved Testability**

- Class-based handlers are easier to unit test
- Feature-specific test suites can be isolated
- Shared testing utilities for common patterns

### 4. **Enhanced Maintainability**

- Changes to authentication or error handling affect all handlers automatically
- Adding new endpoints follows established patterns
- Clear separation of concerns

### 5. **Better Type Safety**

- Strongly-typed request/response contracts
- Feature-specific dependency interfaces
- Compile-time validation of handler signatures

## Migration Strategy

### Phase 1: Create Infrastructure

1. Create shared handler base classes
2. Implement standardized response utilities
3. Set up validation system

### Phase 2: Migrate by Feature

1. Start with health checks (simplest)
2. Migrate authentication routes
3. Migrate collections routes (most complex)

### Phase 3: Cleanup

1. Remove old factory functions
2. Update tests to use new patterns
3. Update documentation

### Phase 4: Optimization

1. Add route-level middleware where appropriate
2. Implement request/response DTOs
3. Add comprehensive integration tests for each feature router

## Breaking Changes

- Handler factory functions will be replaced with class instances
- Route registration will change from function calls to router composition
- Dependency injection will use feature-specific interfaces instead of full `Deps` object

## Considerations

- This is a significant architectural change that will require updating all route handlers
- Consider implementing incrementally, starting with new features
- Ensure comprehensive test coverage during migration
- May require updates to middleware and dependency injection patterns
