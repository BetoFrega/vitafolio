# Implementation Plan: Core Life Management System

**Branch**: `001-build-vitafolio-a` | **Date**: September 9, 2025 | **Spec**: [spec.md](/workspaces/vitafolio/specs/001-build-vitafolio-a/spec.md)
**Input**: Feature specification from `/workspaces/vitafolio/specs/001-build-vitafolio-a/spec.md`

## Execution Flow (/plan command scope)

```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
4. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
5. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, or `GEMINI.md` for Gemini CLI).
6. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
7. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
8. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:

- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary

Core life management system implementing flexible collections that define metadata schemas for organizing personal items. Users can create collections (Library, Pantry, Appliances, etc.), define custom metadata fields for each collection type, and add items with collection-specific attributes. System includes multi-user support, authentication, notifications for actionable metadata (expiration dates, maintenance schedules), and extensible plugin architecture. Technical approach leverages existing Clean Architecture boilerplate with TypeScript, in-memory implementations initially, HTTP-based API with comprehensive documentation.

## Technical Context

**Language/Version**: TypeScript (latest stable)  
**Primary Dependencies**: Express.js (existing), Node.js runtime, existing Clean Architecture libraries  
**Storage**: In-memory repositories initially (with interfaces for future database implementations)  
**Testing**: Vitest (existing setup), following TDD principles  
**Target Platform**: Node.js server (Linux/container deployment)
**Project Type**: Single backend service with HTTP API (leveraging existing Clean Architecture structure)  
**Performance Goals**: Standard web service performance (<500ms API responses, 100+ concurrent users)  
**Constraints**: Must follow existing Clean Architecture patterns, replaceable in-memory storage, well-documented HTTP API  
**Scale/Scope**: Initial prototype supporting 10-50 users, 1000s of items per user, extensible to production scale

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

**Simplicity**:

- Projects: 1 (single backend service extending existing architecture)
- Using framework directly? (yes - Express.js, no wrapper classes)
- Single data model? (yes - unified domain model for collections/items)
- Avoiding patterns? (using existing Repository pattern from current codebase)

**Architecture**:

- EVERY feature as library? (yes - extending existing lib/ structure with new domain)
- Libraries listed: @collections (collection management), @items (item management), @metadata (metadata schemas), @notifications (actionable alerts)
- CLI per library: (TBD - focus on HTTP API first, CLI consideration for admin tasks)
- Library docs: (will follow existing patterns, OpenAPI for HTTP API)

**Testing (NON-NEGOTIABLE)**:

- RED-GREEN-Refactor cycle enforced? (yes - mandatory TDD as per copilot-instructions.md)
- Git commits show tests before implementation? (yes - required workflow)
- Order: Contract→Integration→E2E→Unit strictly followed? (yes - following existing patterns)
- Real dependencies used? (in-memory initially, but architected for real DB replacement)
- Integration tests for: new libraries, contract changes, shared schemas? (yes - planned)
- FORBIDDEN: Implementation before test, skipping RED phase (enforced)

**Observability**:

- Structured logging included? (will follow existing patterns)
- Frontend logs → backend? (N/A - backend-only service initially)
- Error context sufficient? (yes - using existing Result pattern)

**Versioning**:

- Version number assigned? (001 - first feature implementation)
- BUILD increments on every change? (yes - following existing patterns)
- Breaking changes handled? (yes - careful interface design for future extensions)

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)

```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 1 (Single project) - extending existing Clean Architecture with new domain modules

## Phase 0: Outline & Research

1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:

   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts

_Prerequisites: research.md complete_

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `/scripts/update-agent-context.sh [claude|gemini|copilot]` for your AI assistant
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- Load `/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Create domain structure following existing `lib/iam/` pattern with new `lib/collections/` module
- Each contract endpoint → contract test task [P]
- Each entity (Collection, Item, MetadataSchema, Notification) → model creation task [P]
- Each use case from functional requirements → use case implementation task
- Each user story from quickstart → integration test task
- Repository interfaces and in-memory implementations → infrastructure tasks
- HTTP route handlers following existing Express patterns → API implementation tasks

**Domain Module Structure**:

```
lib/collections/
├── domain/
│   ├── aggregates/
│   │   ├── Collection.ts + Collection.test.ts
│   │   ├── Item.ts + Item.test.ts
│   │   └── Notification.ts + Notification.test.ts
│   └── value-objects/
│       ├── CollectionId.ts + CollectionId.test.ts
│       ├── ItemId.ts + ItemId.test.ts
│       ├── MetadataSchema.ts + MetadataSchema.test.ts
│       └── MetadataValues.ts + MetadataValues.test.ts
├── app/
│   ├── CreateCollection.ts + CreateCollection.test.ts
│   ├── AddItemToCollection.ts + AddItemToCollection.test.ts
│   ├── UpdateItem.ts + UpdateItem.test.ts
│   ├── SearchItems.ts + SearchItems.test.ts
│   └── GenerateNotifications.ts + GenerateNotifications.test.ts
├── ports/
│   ├── CollectionRepository.ts
│   ├── ItemRepository.ts
│   └── NotificationRepository.ts
└── adapters/
    ├── InMemoryCollectionRepository.ts + InMemoryCollectionRepository.test.ts
    ├── InMemoryItemRepository.ts + InMemoryItemRepository.test.ts
    └── InMemoryNotificationRepository.ts + InMemoryNotificationRepository.test.ts
```

**HTTP API Structure** (extending existing `app/http/` structure):

```
app/http/express/routes/
├── makeCreateCollectionHandler.ts + makeCreateCollectionHandler.test.ts
├── makeListCollectionsHandler.ts + makeListCollectionsHandler.test.ts
├── makeGetCollectionHandler.ts + makeGetCollectionHandler.test.ts
├── makeUpdateCollectionHandler.ts + makeUpdateCollectionHandler.test.ts
├── makeDeleteCollectionHandler.ts + makeDeleteCollectionHandler.test.ts
├── makeGetSchemaHandler.ts + makeGetSchemaHandler.test.ts
├── makeUpdateSchemaHandler.ts + makeUpdateSchemaHandler.test.ts
├── makeAddSchemaFieldHandler.ts + makeAddSchemaFieldHandler.test.ts
├── makeUpdateSchemaFieldHandler.ts + makeUpdateSchemaFieldHandler.test.ts
├── makeRemoveSchemaFieldHandler.ts + makeRemoveSchemaFieldHandler.test.ts
├── makeCreateItemHandler.ts + makeCreateItemHandler.test.ts
├── makeListItemsHandler.ts + makeListItemsHandler.test.ts
├── makeGetItemHandler.ts + makeGetItemHandler.test.ts
├── makeUpdateItemHandler.ts + makeUpdateItemHandler.test.ts
├── makeDeleteItemHandler.ts + makeDeleteItemHandler.test.ts
├── makeSearchItemsHandler.ts + makeSearchItemsHandler.test.ts
└── makeListNotificationsHandler.ts + makeListNotificationsHandler.test.ts
```

**Ordering Strategy**:

- TDD order: Contract tests → Domain entities → Use cases → Infrastructure → HTTP handlers
- Dependency order: Value objects → Aggregates → Use cases → Repositories → HTTP layer
- Mark [P] for parallel execution (independent value objects and aggregates)
- Integration tests after individual component tests
- End-to-end quickstart validation as final task

**Estimated Output**: 40-45 numbered, ordered tasks in tasks.md covering:

- 8 value object implementations with tests [P]
- 6 aggregate implementations with tests [P]
- 10 use case implementations with tests (including schema management)
- 6 repository interface and implementation tasks [P]
- 17 HTTP handler implementations with tests (including 5 schema endpoints)
- 4 integration test suites
- 1 end-to-end quickstart validation

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

**Phase Status**:

- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:

- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (none required)

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
