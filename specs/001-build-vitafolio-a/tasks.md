# Tasks: Core Life Management System

**Input**: Design documents from `/specs/001-build-vitafolio-a/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)

```text
1. Load plan.md from feature directory
   → If not found: ERROR "No implementation plan found"
   → Extract: tech stack, libraries, structure
2. Load optional design documents:
   → data-model.md: Extract entities → model tasks
   → contracts/: Each file → contract test task
   → research.md: Extract decisions → setup tasks
3. Generate tasks by category:
   → Setup: project init, dependencies, linting
   → Tests: contract tests, integration tests
   → Core: models, services, CLI commands
   → Integration: DB, middleware, logging
   → Polish: unit tests, performance, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → All contracts have tests?
   → All entities have models?
   → All endpoints implemented?
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: Extending existing Clean Architecture at repository root
- Following existing structure: `lib/[domain]/` for domain logic, `app/http/` for HTTP layer
- Paths assume single project structure per plan.md

## Phase 3.1: Setup

- [ ] T001 Create collections domain structure in `lib/collections/` following existing `lib/iam/` pattern
- [ ] T002 Configure collections domain module imports and path aliases
- [ ] T003 [P] Update `app/ports/Deps.ts` to include collections repositories

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests

- [ ] T004 [P] Contract test POST /api/v1/collections in `app/_tests/collections.contract.test.ts`
- [ ] T005 [P] Contract test GET /api/v1/collections in `app/_tests/collections.contract.test.ts`
- [ ] T006 [P] Contract test GET /api/v1/collections/{id} in `app/_tests/collection-detail.contract.test.ts`
- [ ] T007 [P] Contract test PUT /api/v1/collections/{id} in `app/_tests/collection-detail.contract.test.ts`
- [ ] T008 [P] Contract test DELETE /api/v1/collections/{id} in `app/_tests/collection-detail.contract.test.ts`
- [ ] T009 [P] Contract test POST /api/v1/collections/{id}/items in `app/_tests/items.contract.test.ts`
- [ ] T010 [P] Contract test GET /api/v1/collections/{id}/items in `app/_tests/items.contract.test.ts`
- [ ] T011 [P] Contract test GET /api/v1/items/{id} in `app/_tests/item-detail.contract.test.ts`
- [ ] T012 [P] Contract test PUT /api/v1/items/{id} in `app/_tests/item-detail.contract.test.ts`
- [ ] T013 [P] Contract test DELETE /api/v1/items/{id} in `app/_tests/item-detail.contract.test.ts`
- [ ] T014 [P] Contract test GET /api/v1/notifications in `app/_tests/notifications.contract.test.ts`
- [ ] T015 [P] Contract test GET /api/v1/items/search in `app/_tests/search.contract.test.ts`

### Integration Tests

- [ ] T016 [P] Integration test library collection workflow in `app/_tests/library-workflow.integration.test.ts`
- [ ] T017 [P] Integration test pantry collection workflow in `app/_tests/pantry-workflow.integration.test.ts`
- [ ] T018 [P] Integration test expiration notifications in `app/_tests/expiration-notifications.integration.test.ts`
- [ ] T019 [P] Integration test schema evolution in `app/_tests/schema-evolution.integration.test.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Value Objects

- [ ] T020 [P] CollectionId value object in `lib/collections/domain/value-objects/CollectionId.ts`
- [ ] T021 [P] ItemId value object in `lib/collections/domain/value-objects/ItemId.ts`
- [ ] T022 [P] NotificationId value object in `lib/collections/domain/value-objects/NotificationId.ts`
- [ ] T023 [P] NotificationType value object in `lib/collections/domain/value-objects/NotificationType.ts`
- [ ] T024 [P] NotificationStatus value object in `lib/collections/domain/value-objects/NotificationStatus.ts`
- [ ] T025 [P] MetadataSchema value object in `lib/collections/domain/value-objects/MetadataSchema.ts`
- [ ] T026 [P] MetadataValues value object in `lib/collections/domain/value-objects/MetadataValues.ts`

### Aggregates

- [ ] T027 [P] Collection aggregate in `lib/collections/domain/aggregates/Collection.ts`
- [ ] T028 [P] Item aggregate in `lib/collections/domain/aggregates/Item.ts`
- [ ] T029 [P] Notification aggregate in `lib/collections/domain/aggregates/Notification.ts`

### Repository Ports

- [ ] T030 [P] CollectionRepository interface in `lib/collections/ports/CollectionRepository.ts`
- [ ] T031 [P] ItemRepository interface in `lib/collections/ports/ItemRepository.ts`
- [ ] T032 [P] NotificationRepository interface in `lib/collections/ports/NotificationRepository.ts`

### Use Cases

- [ ] T033 [P] CreateCollection use case in `lib/collections/app/CreateCollection.ts`
- [ ] T034 [P] ListCollections use case in `lib/collections/app/ListCollections.ts`
- [ ] T035 [P] GetCollection use case in `lib/collections/app/GetCollection.ts`
- [ ] T036 [P] UpdateCollection use case in `lib/collections/app/UpdateCollection.ts`
- [ ] T037 [P] DeleteCollection use case in `lib/collections/app/DeleteCollection.ts`
- [ ] T038 [P] AddItemToCollection use case in `lib/collections/app/AddItemToCollection.ts`
- [ ] T039 [P] ListItems use case in `lib/collections/app/ListItems.ts`
- [ ] T040 [P] GetItem use case in `lib/collections/app/GetItem.ts`
- [ ] T041 [P] UpdateItem use case in `lib/collections/app/UpdateItem.ts`
- [ ] T042 [P] DeleteItem use case in `lib/collections/app/DeleteItem.ts`
- [ ] T043 [P] SearchItems use case in `lib/collections/app/SearchItems.ts`
- [ ] T044 [P] GenerateNotifications use case in `lib/collections/app/GenerateNotifications.ts`
- [ ] T045 [P] ListNotifications use case in `lib/collections/app/ListNotifications.ts`

### Repository Implementations

- [ ] T046 [P] InMemoryCollectionRepository in `lib/collections/adapters/InMemoryCollectionRepository.ts`
- [ ] T047 [P] InMemoryItemRepository in `lib/collections/adapters/InMemoryItemRepository.ts`
- [ ] T048 [P] InMemoryNotificationRepository in `lib/collections/adapters/InMemoryNotificationRepository.ts`

## Phase 3.4: HTTP Layer Implementation

### Route Handlers

- [ ] T049 POST /api/v1/collections handler in `app/http/express/routes/makeCreateCollectionHandler.ts`
- [ ] T050 GET /api/v1/collections handler in `app/http/express/routes/makeListCollectionsHandler.ts`
- [ ] T051 GET /api/v1/collections/{id} handler in `app/http/express/routes/makeGetCollectionHandler.ts`
- [ ] T052 PUT /api/v1/collections/{id} handler in `app/http/express/routes/makeUpdateCollectionHandler.ts`
- [ ] T053 DELETE /api/v1/collections/{id} handler in `app/http/express/routes/makeDeleteCollectionHandler.ts`
- [ ] T054 POST /api/v1/collections/{id}/items handler in `app/http/express/routes/makeCreateItemHandler.ts`
- [ ] T055 GET /api/v1/collections/{id}/items handler in `app/http/express/routes/makeListItemsHandler.ts`
- [ ] T056 GET /api/v1/items/{id} handler in `app/http/express/routes/makeGetItemHandler.ts`
- [ ] T057 PUT /api/v1/items/{id} handler in `app/http/express/routes/makeUpdateItemHandler.ts`
- [ ] T058 DELETE /api/v1/items/{id} handler in `app/http/express/routes/makeDeleteItemHandler.ts`
- [ ] T059 GET /api/v1/items/search handler in `app/http/express/routes/makeSearchItemsHandler.ts`
- [ ] T060 GET /api/v1/notifications handler in `app/http/express/routes/makeListNotificationsHandler.ts`

### Route Registration

- [ ] T061 Register collections routes in `app/http/express/routes/index.ts`

## Phase 3.5: Integration

- [ ] T062 Update main Express app to include collections routes in `app/http/express/makeExpressApp.ts`
- [ ] T063 Update dependency injection container in `app/ports/Deps.ts`
- [ ] T064 Create collections repositories factory in `app/main.ts`

## Phase 3.6: Polish

- [ ] T065 [P] Unit tests for CollectionId in `lib/collections/domain/value-objects/CollectionId.test.ts`
- [ ] T066 [P] Unit tests for ItemId in `lib/collections/domain/value-objects/ItemId.test.ts`
- [ ] T067 [P] Unit tests for NotificationId in `lib/collections/domain/value-objects/NotificationId.test.ts`
- [ ] T068 [P] Unit tests for NotificationType in `lib/collections/domain/value-objects/NotificationType.test.ts`
- [ ] T069 [P] Unit tests for NotificationStatus in `lib/collections/domain/value-objects/NotificationStatus.test.ts`
- [ ] T070 [P] Unit tests for MetadataSchema in `lib/collections/domain/value-objects/MetadataSchema.test.ts`
- [ ] T071 [P] Unit tests for MetadataValues in `lib/collections/domain/value-objects/MetadataValues.test.ts`
- [ ] T072 [P] Unit tests for Collection in `lib/collections/domain/aggregates/Collection.test.ts`
- [ ] T073 [P] Unit tests for Item in `lib/collections/domain/aggregates/Item.test.ts`
- [ ] T074 [P] Unit tests for Notification in `lib/collections/domain/aggregates/Notification.test.ts`
- [ ] T075 [P] Unit tests for CreateCollection in `lib/collections/app/CreateCollection.test.ts`
- [ ] T076 [P] Unit tests for ListCollections in `lib/collections/app/ListCollections.test.ts`
- [ ] T077 [P] Unit tests for GetCollection in `lib/collections/app/GetCollection.test.ts`
- [ ] T078 [P] Unit tests for UpdateCollection in `lib/collections/app/UpdateCollection.test.ts`
- [ ] T079 [P] Unit tests for DeleteCollection in `lib/collections/app/DeleteCollection.test.ts`
- [ ] T080 [P] Unit tests for AddItemToCollection in `lib/collections/app/AddItemToCollection.test.ts`
- [ ] T081 [P] Unit tests for ListItems in `lib/collections/app/ListItems.test.ts`
- [ ] T082 [P] Unit tests for GetItem in `lib/collections/app/GetItem.test.ts`
- [ ] T083 [P] Unit tests for UpdateItem in `lib/collections/app/UpdateItem.test.ts`
- [ ] T084 [P] Unit tests for DeleteItem in `lib/collections/app/DeleteItem.test.ts`
- [ ] T085 [P] Unit tests for SearchItems in `lib/collections/app/SearchItems.test.ts`
- [ ] T086 [P] Unit tests for GenerateNotifications in `lib/collections/app/GenerateNotifications.test.ts`
- [ ] T087 [P] Unit tests for ListNotifications in `lib/collections/app/ListNotifications.test.ts`
- [ ] T088 [P] Unit tests for InMemoryCollectionRepository in `lib/collections/adapters/InMemoryCollectionRepository.test.ts`
- [ ] T089 [P] Unit tests for InMemoryItemRepository in `lib/collections/adapters/InMemoryItemRepository.test.ts`
- [ ] T090 [P] Unit tests for InMemoryNotificationRepository in `lib/collections/adapters/InMemoryNotificationRepository.test.ts`
- [ ] T091 [P] Unit tests for route handlers in respective `.test.ts` files
- [ ] T092 End-to-end quickstart validation following `quickstart.md` scenarios
- [ ] T093 Performance validation (<500ms API responses)
- [ ] T094 TypeScript strict mode validation

## Dependencies

- Setup (T001-T003) before everything
- Contract tests (T004-T015) before implementation (T020+)
- Integration tests (T016-T019) before implementation (T020+)
- Value objects (T020-T026) before aggregates (T027-T029)
- Repository ports (T030-T032) before implementations (T046-T048)
- Domain layer (T020-T032) before use cases (T033-T045)
- Use cases (T033-T045) before HTTP handlers (T049-T060)
- HTTP handlers before route registration (T061)
- Core implementation before integration (T062-T064)
- Everything before polish (T065-T094)

## Parallel Execution Examples

### Setup Phase (T001-T003)

```bash
# Can run T002-T003 in parallel after T001
Task: "Configure collections domain module imports and path aliases"
Task: "Update app/ports/Deps.ts to include collections repositories"
```

### Contract Tests Phase (T004-T015)

```bash
# All contract tests can run in parallel
Task: "Contract test POST /api/v1/collections in app/_tests/collections.contract.test.ts"
Task: "Contract test GET /api/v1/collections in app/_tests/collections.contract.test.ts"
Task: "Contract test GET /api/v1/collections/{id} in app/_tests/collection-detail.contract.test.ts"
Task: "Contract test POST /api/v1/collections/{id}/items in app/_tests/items.contract.test.ts"
# ... all 12 contract tests can run together
```

### Integration Tests Phase (T016-T019)

```bash
# All integration tests can run in parallel
Task: "Integration test library collection workflow in app/_tests/library-workflow.integration.test.ts"
Task: "Integration test pantry collection workflow in app/_tests/pantry-workflow.integration.test.ts"
Task: "Integration test expiration notifications in app/_tests/expiration-notifications.integration.test.ts"
Task: "Integration test schema evolution in app/_tests/schema-evolution.integration.test.ts"
```

### Value Objects Phase (T020-T026)

```bash
# All value objects can run in parallel (different files)
Task: "CollectionId value object in lib/collections/domain/value-objects/CollectionId.ts"
Task: "ItemId value object in lib/collections/domain/value-objects/ItemId.ts"
Task: "NotificationId value object in lib/collections/domain/value-objects/NotificationId.ts"
Task: "NotificationType value object in lib/collections/domain/value-objects/NotificationType.ts"
Task: "NotificationStatus value object in lib/collections/domain/value-objects/NotificationStatus.ts"
Task: "MetadataSchema value object in lib/collections/domain/value-objects/MetadataSchema.ts"
Task: "MetadataValues value object in lib/collections/domain/value-objects/MetadataValues.ts"
```

### Aggregates Phase (T027-T029)

```bash
# All aggregates can run in parallel (different files)
Task: "Collection aggregate in lib/collections/domain/aggregates/Collection.ts"
Task: "Item aggregate in lib/collections/domain/aggregates/Item.ts"
Task: "Notification aggregate in lib/collections/domain/aggregates/Notification.ts"
```

### Repository Ports Phase (T030-T032)

```bash
# All repository interfaces can run in parallel
Task: "CollectionRepository interface in lib/collections/ports/CollectionRepository.ts"
Task: "ItemRepository interface in lib/collections/ports/ItemRepository.ts"
Task: "NotificationRepository interface in lib/collections/ports/NotificationRepository.ts"
```

### Use Cases Phase (T033-T045)

```bash
# All use cases can run in parallel (different files)
Task: "CreateCollection use case in lib/collections/app/CreateCollection.ts"
Task: "ListCollections use case in lib/collections/app/ListCollections.ts"
Task: "GetCollection use case in lib/collections/app/GetCollection.ts"
# ... all 13 use cases can run together
```

### Repository Implementations Phase (T046-T048)

```bash
# All repository implementations can run in parallel
Task: "InMemoryCollectionRepository in lib/collections/adapters/InMemoryCollectionRepository.ts"
Task: "InMemoryItemRepository in lib/collections/adapters/InMemoryItemRepository.ts"
Task: "InMemoryNotificationRepository in lib/collections/adapters/InMemoryNotificationRepository.ts"
```

### Unit Tests Phase (T065-T090)

```bash
# All unit test files can run in parallel (different files)
Task: "Unit tests for CollectionId in lib/collections/domain/value-objects/CollectionId.test.ts"
Task: "Unit tests for ItemId in lib/collections/domain/value-objects/ItemId.test.ts"
Task: "Unit tests for NotificationId in lib/collections/domain/value-objects/NotificationId.test.ts"
# ... all 26 unit test files can run together
```

## Notes

- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Avoid: vague tasks, same file conflicts
- Follow existing Clean Architecture patterns from `lib/iam/` domain
- Use existing Result pattern for error handling
- Follow TDD principles: RED → GREEN → REFACTOR

## Task Generation Rules Applied

1. **From Contracts**: Each endpoint → contract test + implementation task
2. **From Data Model**: Each entity/value object → model creation task [P]
3. **From User Stories**: Each quickstart scenario → integration test [P]
4. **Ordering**: Setup → Tests → Models → Services → Endpoints → Polish
5. **Dependencies**: Domain layer before application layer before infrastructure

## Validation Checklist

- [x] All contracts have corresponding tests (T004-T015)
- [x] All entities have model tasks (T020-T029)
- [x] All tests come before implementation (T004-T019 before T020+)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD workflow enforced (tests first, then implementation)
- [x] Follows existing Clean Architecture patterns
