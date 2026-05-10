# Task: Implement test pyramid for Lumora

## Goals
- ✅ Configure vitest as test runner across packages (API, shared)
- ✅ Write unit tests for pure functions (moderation, prompt-template rendering)
- ✅ Write integration test scaffolds for Hono routes
- ✅ Update AGENTS.md with test commands
- ✅ All tests must pass before done

## Checklist
- [x] Install vitest in api and shared packages
- [x] Configure vitest (api vitest.config.ts, shared vitest.config.ts)
- [x] Add test scripts to package.json files and turbo.json
- [x] Unit: moderation.service runPromptPrecheck (12 tests)
- [x] Unit: prompt-template.service renderPromptTemplate (9 tests)
- [x] Unit: shared Zod schemas parse/validate (29 tests)
- [x] Integration: Hono app health endpoint (1 test)
- [x] Split index.ts → app.ts + index.ts for testability
- [x] Update AGENTS.md testing section with run commands
- [x] All tests green (51 total), typecheck green

## Notes
- Test pyramid: 42 unit + 1 integration = 43 API+shared, 29 shared-only = 51 total
- E2E deferred (YAGNI — no local infra)
- Prior node:test files removed to avoid vitest conflicts
- vitest chosen over node:test for cross-package consistency and watch mode
- Split index.ts so serve() doesn't fire during tests
