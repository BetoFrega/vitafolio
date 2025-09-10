# App Layer Testing - Quick Reference

## Test Types at a Glance

| Test Type       | File Pattern            | Purpose                   | Dependencies                | When to Use                     |
| --------------- | ----------------------- | ------------------------- | --------------------------- | ------------------------------- |
| **Health**      | `*.test.ts`             | Service availability      | None                        | Basic health checks             |
| **Contract**    | `*.contract.test.ts`    | API contract verification | Mocked (`createMockDeps()`) | Define API structure during TDD |
| **Integration** | `*.integration.test.ts` | Business workflow testing | Mixed (mocked/real)         | Multi-step business scenarios   |
| **E2E**         | `*.e2e.test.ts`         | Full system testing       | Real implementations        | Pre-deployment verification     |

## Quick Decision Guide

**Starting a new feature?** → Begin with **Contract tests** to define your API

**Testing user workflows?** → Use **Integration tests** for multi-step scenarios

**Ready to deploy?** → Run **E2E tests** with real implementations

**Just need basic health checks?** → Use **Health tests**

## TDD Workflow

1. **Red**: Write Contract test → Integration test → E2E test (all fail)
2. **Green**: Implement Domain → Use Cases → Handlers → Wiring (tests pass)
3. **Refactor**: Improve code while keeping all test types passing

## Helper Files

- `helpers/mockDeps.ts` - Complete dependency mocking for contract tests
- `helpers/mockRepositories.ts` - Individual repository mocks

## Current Test Coverage

✅ **Health Tests**: `health.test.ts` - Service availability  
✅ **Contract Tests**: Collections, Items, Notifications API contracts  
✅ **Integration Tests**: Library workflow, Expiration notifications, Schema evolution  
✅ **E2E Tests**: `collections.e2e.test.ts` - Full system with real implementations

For complete details, see `TEST_STRATEGY.md` in this directory.
