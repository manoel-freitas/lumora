/**
 * @process character-centric-redesign
 * @description Full-stack character-centric redesign for Lumora — merges influencer_profiles into
 *   characters, removes personas module, updates campaigns/generations/gallery, rebuilds frontend hub.
 *   Spec: docs/superpowers/specs/2026-05-10-character-centric-redesign.md
 *
 * @skill drizzle     specializations/web-development/skills/drizzle/SKILL.md
 * @skill vitest      specializations/web-development/skills/vitest/SKILL.md
 * @skill nuxt        specializations/web-development/skills/nuxt/SKILL.md
 * @skill zod         specializations/web-development/skills/zod/SKILL.md
 * @agent backend-developer  specializations/web-development/agents/backend-developer/AGENT.md
 * @agent fullstack-architect specializations/web-development/agents/fullstack-architect/AGENT.md
 * @agent vue-developer      specializations/web-development/agents/vue-developer/AGENT.md
 */

import { defineTask } from '@a5c-ai/babysitter-sdk';

const SPEC_PATH = 'docs/superpowers/specs/2026-05-10-character-centric-redesign.md';
const PROJECT_ROOT = '/home/manoelfreitas/workspace/lumora';

// ============================================================================
// MAIN PROCESS
// ============================================================================

export async function process(inputs, ctx) {
  ctx.log('info', 'Starting character-centric redesign — brownfield full-stack migration');

  // ============================================================================
  // PHASE 1: SHARED PACKAGE SCHEMAS
  // ============================================================================

  ctx.log('info', 'Phase 1: Updating shared Zod schemas in @lumora/shared');

  const sharedSchemasResult = await ctx.task(updateSharedSchemasTask, {
    specPath: SPEC_PATH,
    projectRoot: PROJECT_ROOT,
  });

  // ============================================================================
  // PHASE 2: BACKEND API CHANGES
  // ============================================================================

  ctx.log('info', 'Phase 2: Updating backend API — removing personas, updating campaigns/generations/gallery');

  const backendResult = await ctx.task(updateBackendApiTask, {
    specPath: SPEC_PATH,
    projectRoot: PROJECT_ROOT,
    sharedSchemasSummary: sharedSchemasResult.summary,
  });

  // ============================================================================
  // PHASE 3: DB MIGRATION — GENERATE
  // ============================================================================

  ctx.log('info', 'Phase 3: Generating Drizzle migration');

  const generateResult = await ctx.task(dbGenerateTask, {
    projectRoot: PROJECT_ROOT,
  });

  // ============================================================================
  // BREAKPOINT: REVIEW MIGRATION (alwaysBreakOn: database-migration)
  // ============================================================================

  const migrationApproval = await ctx.breakpoint({
    question: 'DB migration generated. Review the migration SQL and approve running pnpm db:migrate.',
    title: 'Database Migration Review',
    options: ['Approve — run migrate', 'Reject — stop here'],
    expert: 'owner',
    tags: ['database-migration', 'destructive'],
    context: {
      runId: ctx.runId,
      info: generateResult.migrationInfo,
    },
  });

  if (!migrationApproval.approved) {
    ctx.log('warn', 'User rejected DB migration — stopping run');
    return {
      success: false,
      reason: 'User rejected database migration',
      feedback: migrationApproval.response,
    };
  }

  // ============================================================================
  // PHASE 4: DB MIGRATION — RUN
  // ============================================================================

  ctx.log('info', 'Phase 4: Running DB migration');

  const migrateResult = await ctx.task(dbMigrateTask, {
    projectRoot: PROJECT_ROOT,
  });

  // ============================================================================
  // PHASE 5: FRONTEND CHANGES
  // ============================================================================

  ctx.log('info', 'Phase 5: Updating Nuxt 4 frontend — navigation, dashboard, character hub, composables');

  const frontendResult = await ctx.task(updateFrontendTask, {
    specPath: SPEC_PATH,
    projectRoot: PROJECT_ROOT,
    backendSummary: backendResult.summary,
  });

  // ============================================================================
  // PHASE 6: QUALITY GATE — TYPECHECK
  // ============================================================================

  ctx.log('info', 'Phase 6a: Running typecheck');

  const typecheckResult = await ctx.task(typecheckTask, {
    projectRoot: PROJECT_ROOT,
  });

  if (!typecheckResult.success) {
    ctx.log('warn', 'Typecheck failed — running fix iteration');

    const typefixResult = await ctx.task(fixTypecheckTask, {
      projectRoot: PROJECT_ROOT,
      errors: typecheckResult.errors,
    });

    // Re-run typecheck to verify fix
    const typecheckRecheck = await ctx.task(typecheckTask, {
      projectRoot: PROJECT_ROOT,
    });

    if (!typecheckRecheck.success) {
      ctx.log('error', 'Typecheck still failing after fix attempt');
    }
  }

  // ============================================================================
  // PHASE 6: QUALITY GATE — TESTS
  // ============================================================================

  ctx.log('info', 'Phase 6b: Running test suite');

  const testResult = await ctx.task(testSuiteTask, {
    projectRoot: PROJECT_ROOT,
  });

  if (!testResult.success) {
    ctx.log('warn', 'Tests failed — running fix iteration');

    const testfixResult = await ctx.task(fixTestsTask, {
      projectRoot: PROJECT_ROOT,
      failures: testResult.failures,
    });

    // Re-run tests to verify
    const testRecheck = await ctx.task(testSuiteTask, {
      projectRoot: PROJECT_ROOT,
    });
  }

  // ============================================================================
  // FINAL BREAKPOINT — HUMAN VERIFICATION
  // ============================================================================

  const finalApproval = await ctx.breakpoint({
    question: 'Implementation complete. Review the changes and approve to close the run.',
    title: 'Character-Centric Redesign — Final Review',
    options: ['Approve — done', 'Request changes'],
    expert: 'owner',
    tags: ['final-review'],
    context: {
      runId: ctx.runId,
      summary: {
        sharedSchemas: sharedSchemasResult.changedFiles,
        backend: backendResult.changedFiles,
        migration: migrateResult.status,
        frontend: frontendResult.changedFiles,
        typecheck: typecheckResult.success,
        tests: testResult.success,
      },
    },
  });

  return {
    success: finalApproval.approved,
    phases: {
      sharedSchemas: sharedSchemasResult,
      backend: backendResult,
      migration: { generate: generateResult, migrate: migrateResult },
      frontend: frontendResult,
      qualityGate: { typecheck: typecheckResult, tests: testResult },
    },
  };
}

// ============================================================================
// TASK: UPDATE SHARED SCHEMAS
// ============================================================================

export const updateSharedSchemasTask = defineTask('update-shared-schemas', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update shared Zod schemas in @lumora/shared',
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Full-stack TypeScript developer working on a pnpm monorepo',
      task: 'Update the shared Zod schemas in packages/shared/src/schemas/ to implement the character-centric redesign spec.',
      context: {
        projectRoot: args.projectRoot,
        specPath: args.specPath,
        repoContext: `
Lumora is a pnpm + turborepo monorepo. Shared schemas are in packages/shared/src/schemas/.
Current state:
- character.ts: minimal schema (name, description, triggerWord, isAdult only)
- campaign.ts: uses influencerProfileId (must change to characterId)
- generation.ts: has influencerProfileId field (must remove)
- persona.ts: entire file must be deleted
- packages/shared/src/index.ts: exports all schemas (must remove persona export)

Target DB schema already has persona fields on characters table and characterId on contentCampaigns.
`,
      },
      instructions: [
        'Read the spec file at docs/superpowers/specs/2026-05-10-character-centric-redesign.md for the full list of new fields.',
        'Read packages/shared/src/schemas/character.ts — add all persona fields (displayName, niche, audience, backstory, personalityTraits, toneOfVoice, languages, contentPillars, visualStyle, boundaries, sfwPolicy, nsfwPolicy, disclosureNote) as optional fields to both createCharacterSchema and updateCharacterSchema.',
        'Read packages/shared/src/schemas/campaign.ts — replace influencerProfileId with characterId (required uuid) in createCampaignSchema. Also update updateCampaignSchema. Also add characterId query param support.',
        'Read packages/shared/src/schemas/generation.ts — remove the influencerProfileId field entirely.',
        'Read packages/shared/src/index.ts — remove any export that references persona.ts or upsertInfluencerProfileSchema.',
        'Delete packages/shared/src/schemas/persona.ts.',
        'Run pnpm --filter @lumora/shared exec tsc --noEmit to verify no type errors in the shared package.',
        'Return a summary of all changed files and what changed in each.',
      ],
      outputFormat: 'JSON with fields: summary (string), changedFiles (string[]), deletedFiles (string[])',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'changedFiles'],
      properties: {
        summary: { type: 'string' },
        changedFiles: { type: 'array', items: { type: 'string' } },
        deletedFiles: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['agent', 'schemas', 'shared'],
}));

// ============================================================================
// TASK: UPDATE BACKEND API
// ============================================================================

export const updateBackendApiTask = defineTask('update-backend-api', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Remove personas module and update campaigns/generations/gallery API',
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Node.js backend developer working on a Hono API with Drizzle ORM',
      task: 'Update the Hono backend to implement the character-centric redesign spec. Remove the personas module and update campaigns, generations, and gallery to use characterId.',
      context: {
        projectRoot: args.projectRoot,
        specPath: args.specPath,
        sharedSchemasSummary: args.sharedSchemasSummary,
        repoContext: `
Backend is a Hono app in apps/api/src/. Modules are in apps/api/src/modules/<domain>/.
Each module has: *.routes.ts, *.service.ts, *.repository.ts.
The DB schema (apps/api/src/db/schema.ts) is already updated — characters table has persona fields,
contentCampaigns has characterId FK, influencer_profiles table is gone.

Current problems:
- apps/api/src/app.ts: still imports and registers personasRouter
- apps/api/src/modules/personas/: entire directory must be deleted
- apps/api/src/modules/campaigns/campaign.repository.ts: imports influencerProfiles from schema (doesn't exist), has personaBelongsToWorkspace using that table
- apps/api/src/modules/campaigns/campaign.routes.ts: validates influencerProfileId, calls personaBelongsToWorkspace
- apps/api/src/modules/generations/: may reference influencerProfileId or personas join
- apps/api/src/modules/gallery/: may have personaId filter
- apps/api/worker.ts: may join influencer_profiles
`,
      },
      instructions: [
        'Read the spec: docs/superpowers/specs/2026-05-10-character-centric-redesign.md',
        'Read apps/api/src/app.ts — remove the personas router import and app.route registration for personas.',
        'Read apps/api/src/modules/personas/persona.routes.ts and persona.repository.ts — understand what they do, then delete the entire apps/api/src/modules/personas/ directory.',
        'Read apps/api/src/modules/campaigns/campaign.repository.ts — replace influencerProfiles import and personaBelongsToWorkspace with characterBelongsToWorkspace that queries the characters table. Update create/update/list functions to use characterId.',
        'Read apps/api/src/modules/campaigns/campaign.routes.ts — replace influencerProfileId validation with characterId validation. Replace persona existence check with character existence check.',
        'Read apps/api/src/modules/generations/generation.service.ts (and worker.ts if it exists separately) — remove any influencerProfileId field from generation creation, remove any join to influencer_profiles, read persona context from the character record directly (character.niche, character.personalityTraits, etc.).',
        'Read apps/api/src/modules/gallery/gallery.routes.ts or gallery.repository.ts — remove any personaId filter parameter.',
        'Read apps/api/src/modules/characters/character.routes.ts and character.repository.ts — ensure GET /characters/:id returns all persona fields (they are on the characters table). Remove GET /characters/:id/persona and PUT /characters/:id/persona routes if they exist.',
        'Read apps/api/worker.ts — remove any join or reference to influencer_profiles.',
        'Return a summary of all changed and deleted files.',
      ],
      outputFormat: 'JSON with fields: summary (string), changedFiles (string[]), deletedFiles (string[])',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'changedFiles'],
      properties: {
        summary: { type: 'string' },
        changedFiles: { type: 'array', items: { type: 'string' } },
        deletedFiles: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['agent', 'backend', 'api'],
}));

// ============================================================================
// TASK: DB GENERATE
// ============================================================================

export const dbGenerateTask = defineTask('db-migration-generate', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Generate Drizzle migration',
  command: `cd ${args.projectRoot} && pnpm db:generate 2>&1 && echo "MIGRATION_GENERATED_OK"`,
  io: {
    stdoutPath: `tasks/${taskCtx.effectId}/stdout.txt`,
    stderrPath: `tasks/${taskCtx.effectId}/stderr.txt`,
  },
  labels: ['shell', 'database', 'migration'],
}));

// ============================================================================
// TASK: DB MIGRATE
// ============================================================================

export const dbMigrateTask = defineTask('db-migration-run', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run Drizzle migration',
  command: `cd ${args.projectRoot} && pnpm db:migrate 2>&1 && echo "MIGRATION_RUN_OK"`,
  io: {
    stdoutPath: `tasks/${taskCtx.effectId}/stdout.txt`,
    stderrPath: `tasks/${taskCtx.effectId}/stderr.txt`,
  },
  labels: ['shell', 'database', 'migration'],
}));

// ============================================================================
// TASK: UPDATE FRONTEND
// ============================================================================

export const updateFrontendTask = defineTask('update-frontend', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Update Nuxt 4 frontend — character hub, navigation, composables',
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'Vue 3 / Nuxt 4 frontend developer',
      task: 'Update the Nuxt 4 frontend to implement the character-centric redesign. The character detail page becomes the main hub with 4 tabs. Remove Campanhas from the top-level sidebar. Update all composables.',
      context: {
        projectRoot: args.projectRoot,
        specPath: args.specPath,
        backendSummary: args.backendSummary,
        repoContext: `
Frontend is a Nuxt 4 app in apps/web/. Pages are in apps/web/app/pages/.
Composables are in apps/web/app/composables/. Components in apps/web/app/components/.

Current state:
- usePersonas.ts: exists — must be deleted
- useCampaigns.ts: uses useCrudResource — must support characterId filter
- useGenerations.ts: create() sends influencerProfileId — must remove that field
- useCharacters.ts: has basic CRUD — must work as-is (persona fields already in API response)
- Sidebar: includes Campanhas in navigation — must remove it
- pages/index.vue: dashboard — needs character cards grid with stats
- pages/characters/[id].vue: simple detail page — becomes 4-tab hub
- pages/generate.vue: has optional character selector — must be required
- pages/campaigns/new.vue: has influencerProfileId selector — replace with characterId
`,
      },
      instructions: [
        'Read the spec: docs/superpowers/specs/2026-05-10-character-centric-redesign.md — understand all frontend changes required.',
        'Delete apps/web/app/composables/usePersonas.ts.',
        'Read and update apps/web/app/composables/useCampaigns.ts — ensure it passes characterId as a filter param and that create() uses characterId not influencerProfileId.',
        'Read and update apps/web/app/composables/useGenerations.ts — remove influencerProfileId from the create() call payload.',
        'Read the sidebar/layout component (look in apps/web/app/layouts/ or apps/web/app/components/) — remove "Campanhas" from the top-level navigation items.',
        'Read and update apps/web/app/pages/index.vue (dashboard) — replace current content with a character cards grid. Each card shows: character name, photo thumbnail, active campaign count, pending approvals count, last generation date. Keep the monthly usage/cost section as secondary.',
        'Read and completely rewrite apps/web/app/pages/characters/[id].vue as the main hub with 4 tabs: (1) Identidade — single form combining visual fields (name, description, triggerWord) + all persona fields (displayName, niche, audience, backstory, personalityTraits, toneOfVoice, languages, contentPillars, visualStyle, boundaries, sfwPolicy, nsfwPolicy, disclosureNote) + reference photo grid below; (2) Campanhas — campaign list filtered to this character + Nova Campanha button pre-filling characterId; (3) Galeria — gallery filtered to this character; (4) Gerar — inline generation form pre-filled with this character.',
        'Read and update apps/web/app/pages/generate.vue — make the character selector required (not optional). On select, ensure persona fields auto-fill (they come from useCharacters.get()).',
        'Read and update apps/web/app/pages/campaigns/new.vue and any CampaignForm component — replace influencerProfileId selector with characterId (pre-filled when opened from character detail tab).',
        'Ensure all Nuxt auto-imports work correctly (composables are auto-imported in Nuxt 4).',
        'Return a summary of all changed and deleted files.',
      ],
      outputFormat: 'JSON with fields: summary (string), changedFiles (string[]), deletedFiles (string[])',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'changedFiles'],
      properties: {
        summary: { type: 'string' },
        changedFiles: { type: 'array', items: { type: 'string' } },
        deletedFiles: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['agent', 'frontend', 'nuxt', 'vue'],
}));

// ============================================================================
// TASK: TYPECHECK
// ============================================================================

export const typecheckTask = defineTask('typecheck', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run pnpm typecheck across all packages',
  command: `cd ${args.projectRoot} && pnpm typecheck 2>&1; echo "EXIT_CODE:$?"`,
  io: {
    stdoutPath: `tasks/${taskCtx.effectId}/stdout.txt`,
    stderrPath: `tasks/${taskCtx.effectId}/stderr.txt`,
  },
  labels: ['shell', 'quality', 'typecheck'],
}));

// ============================================================================
// TASK: FIX TYPECHECK ERRORS
// ============================================================================

export const fixTypecheckTask = defineTask('fix-typecheck', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fix TypeScript type errors',
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'TypeScript developer debugging type errors in a pnpm monorepo',
      task: 'Fix TypeScript type errors caused by the character-centric redesign migration.',
      context: {
        projectRoot: args.projectRoot,
        errors: args.errors,
        repoContext: 'Lumora monorepo: apps/api (Hono), apps/web (Nuxt 4), packages/shared (Zod schemas). Run pnpm typecheck to verify.',
      },
      instructions: [
        'Analyze the typecheck errors provided.',
        'Locate each error file and fix the type issue — likely caused by: removed influencerProfileId fields, deleted influencerProfiles import, removed persona.ts schema, or updated characterId references.',
        'After fixing, do NOT re-run typecheck — the orchestrator will do that.',
        'Return a summary of what you fixed.',
      ],
      outputFormat: 'JSON with fields: summary (string), fixedFiles (string[])',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'fixedFiles'],
      properties: {
        summary: { type: 'string' },
        fixedFiles: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['agent', 'quality', 'typecheck', 'fix'],
}));

// ============================================================================
// TASK: RUN TESTS
// ============================================================================

export const testSuiteTask = defineTask('test-suite', (args, taskCtx) => ({
  kind: 'shell',
  title: 'Run full test suite (vitest)',
  command: `cd ${args.projectRoot} && pnpm test 2>&1; echo "EXIT_CODE:$?"`,
  io: {
    stdoutPath: `tasks/${taskCtx.effectId}/stdout.txt`,
    stderrPath: `tasks/${taskCtx.effectId}/stderr.txt`,
  },
  labels: ['shell', 'quality', 'tests'],
}));

// ============================================================================
// TASK: FIX FAILING TESTS
// ============================================================================

export const fixTestsTask = defineTask('fix-tests', (args, taskCtx) => ({
  kind: 'agent',
  title: 'Fix failing tests after migration',
  execution: { model: 'claude-sonnet-4-6' },
  agent: {
    name: 'general-purpose',
    prompt: {
      role: 'TypeScript developer fixing unit/integration tests in a vitest monorepo',
      task: 'Fix failing tests caused by the character-centric redesign migration.',
      context: {
        projectRoot: args.projectRoot,
        failures: args.failures,
        repoContext: `
Lumora test setup: vitest, no test database (infra is mocked).
Tests live next to source files (foo.ts -> foo.test.ts).
Tests may fail because: influencerProfileId removed from schemas, persona module removed,
campaign schema changed to characterId, generation schema updated.
`,
      },
      instructions: [
        'Analyze the test failures provided.',
        'Locate each failing test file and fix the test — update mocks/fixtures to use characterId instead of influencerProfileId, remove persona references, update schema usage.',
        'Do not change test intent — only update to match the new schema.',
        'Return a summary of what you fixed.',
      ],
      outputFormat: 'JSON with fields: summary (string), fixedFiles (string[])',
    },
    outputSchema: {
      type: 'object',
      required: ['summary', 'fixedFiles'],
      properties: {
        summary: { type: 'string' },
        fixedFiles: { type: 'array', items: { type: 'string' } },
      },
    },
  },
  io: {
    inputJsonPath: `tasks/${taskCtx.effectId}/input.json`,
    outputJsonPath: `tasks/${taskCtx.effectId}/output.json`,
  },
  labels: ['agent', 'quality', 'tests', 'fix'],
}));
