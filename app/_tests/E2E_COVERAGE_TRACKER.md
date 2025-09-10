# E2E Test Coverage Tracker

## 🚨 MANDATORY REQUIREMENT: ALL ROUTES MUST HAVE E2E COVERAGE

This document tracks E2E test coverage for all API routes. **Every route must have corresponding E2E tests** that verify complete system behavior with real implementations.

## Coverage Status

### ✅ Routes with Complete E2E Coverage

| Route                           | Method | E2E Test File                      | Status     |
| ------------------------------- | ------ | ---------------------------------- | ---------- |
| `/health`                       | GET    | `health.e2e.test.ts`               | ✅ Covered |
| `/register`                     | POST   | `collections.e2e.test.ts`          | ✅ Covered |
| `/login`                        | POST   | `collections.e2e.test.ts`          | ✅ Covered |
| `/api/v1/collections`           | POST   | `collections.e2e.test.ts`          | ✅ Covered |
| `/api/v1/collections`           | GET    | `collections.e2e.test.ts`          | ✅ Covered |
| `/api/v1/collections/:id`       | GET    | `collections.e2e.test.ts`          | ✅ Covered |
| `/api/v1/collections/:id`       | PUT    | `collections-advanced.e2e.test.ts` | ✅ Covered |
| `/api/v1/collections/:id`       | DELETE | `collections-advanced.e2e.test.ts` | ✅ Covered |
| `/api/v1/collections/:id/items` | POST   | `collections.e2e.test.ts`          | ✅ Covered |
| `/api/v1/collections/:id/items` | GET    | `collections.e2e.test.ts`          | ✅ Covered |
| `/api/v1/items/:id`             | GET    | `items.e2e.test.ts`                | ✅ Covered |
| `/api/v1/items/:id`             | PUT    | `collections-advanced.e2e.test.ts` | ✅ Covered |
| `/api/v1/items/:id`             | DELETE | `collections-advanced.e2e.test.ts` | ✅ Covered |

### ❌ Routes Missing E2E Coverage (ACTION REQUIRED)

| Route                   | Method | Required E2E Test File                      | Priority  | Blocker              |
| ----------------------- | ------ | ------------------------------------------- | --------- | -------------------- |
| `/debug/auth`           | GET    | `auth.e2e.test.ts`                          | 🔴 HIGH   | Auth module          |
| `/api/v1/notifications` | GET    | `notifications.e2e.test.ts`                 | 🟡 MEDIUM | Currently skipped    |
| `/api/v1/items/search`  | GET    | `search.e2e.test.ts` or `items.e2e.test.ts` | 🟡 MEDIUM | Search functionality |

### ❌ Routes Missing E2E Coverage (ACTION REQUIRED)

| Route                   | Method | Required E2E Test File                      | Priority  | Blocker              |
| ----------------------- | ------ | ------------------------------------------- | --------- | -------------------- |
| `/health`               | GET    | `health.e2e.test.ts`                        | 🔴 HIGH   | New architecture     |
| `/debug/auth`           | GET    | `auth.e2e.test.ts`                          | 🔴 HIGH   | Auth module          |
| `/api/v1/notifications` | GET    | `notifications.e2e.test.ts`                 | 🟡 MEDIUM | Currently skipped    |
| `/api/v1/items/search`  | GET    | `search.e2e.test.ts` or `items.e2e.test.ts` | 🟡 MEDIUM | Search functionality |

## TDD Workflow Requirement

When implementing new route modules, **E2E tests MUST be written BEFORE implementation**:

### Phase 1: E2E Tests First (RED)

1. Create E2E test file for new module
2. Write comprehensive E2E tests for ALL endpoints in the module
3. Run tests - they should FAIL (RED phase)

### Phase 2: Implementation (GREEN)

4. Implement route module following architecture patterns
5. Write unit tests and integration tests
6. Implement handlers and router
7. All tests should PASS (GREEN phase)

### Phase 3: Refactor

8. Improve code while keeping all tests green

## E2E Test Template

Use this template for new E2E tests:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { createTestApp } from "../helpers/e2e-setup";
import request from "supertest";

describe("[Module] E2E Tests", () => {
  let app: any;
  let token: string;

  beforeEach(async () => {
    const setup = await createTestApp();
    app = setup.app;

    // If authentication required:
    // token = setup.authToken;
  });

  describe("[Endpoint Name]", () => {
    it("should handle happy path", async () => {
      const response = await request(app)
        .get("/endpoint")
        .set("Authorization", `Bearer ${token}`) // if auth required
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Object),
        timestamp: expect.any(String),
      });
    });

    it("should handle error cases", async () => {
      // Test error scenarios
    });

    it("should require authentication", async () => {
      // Test auth requirements if applicable
      await request(app).get("/endpoint").expect(401);
    });
  });
});
```

## Coverage Verification

Before merging any PR:

1. ✅ All new routes have corresponding E2E tests
2. ✅ All E2E tests are passing
3. ✅ No existing E2E tests are broken
4. ✅ Coverage status updated in this document

## Automation (Future)

Consider adding automated checks:

- Pre-commit hook to verify E2E coverage
- CI pipeline step to run E2E tests
- Coverage report generation

---

**Last Updated**: After creating health.e2e.test.ts - ✅ Health endpoint now has complete E2E coverage  
**Next Action**: Create missing E2E tests for debug/auth, notifications, search routes
