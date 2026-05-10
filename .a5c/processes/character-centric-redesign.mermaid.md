# Character-Centric Redesign — Process Flow

```mermaid
flowchart TD
    START([Start]) --> P1

    subgraph P1 [Phase 1: Shared Schemas]
        T1[update-shared-schemas\nagent: general-purpose\n\ncharacter.ts + persona fields\ncampaign.ts influencerProfileId → characterId\ngeneration.ts remove influencerProfileId\ndelete persona.ts]
    end

    P1 --> P2

    subgraph P2 [Phase 2: Backend API]
        T2[update-backend-api\nagent: general-purpose\n\nRemove personas module + router\nCampaigns: characterId FK check\nGenerations: remove persona join\nGallery: remove personaId filter\nCharacters: serve persona fields inline]
    end

    P2 --> P3

    subgraph P3 [Phase 3: DB Migration]
        T3a[db-migration-generate\nshell: pnpm db:generate]
        T3a --> BP1{Breakpoint\nReview migration SQL\nalwaysBreakOn: database-migration}
        BP1 -->|Approved| T3b[db-migration-run\nshell: pnpm db:migrate]
        BP1 -->|Rejected| FAIL([Stop])
    end

    T3b --> P4

    subgraph P4 [Phase 4: Frontend]
        T4[update-frontend\nagent: general-purpose\n\nDelete usePersonas.ts\nUpdate useCampaigns, useGenerations\nSidebar: remove Campanhas\nDashboard: character cards grid\ncharacters/id.vue: 4-tab hub\ngenerate.vue: required character\nCampaignForm: characterId]
    end

    P4 --> P5

    subgraph P5 [Phase 5: Quality Gate]
        QT[typecheck\nshell: pnpm typecheck]
        QT --> QT_OK{Pass?}
        QT_OK -->|No| FT[fix-typecheck\nagent]
        FT --> QT
        QT_OK -->|Yes| QR[test-suite\nshell: pnpm test]
        QR --> QR_OK{Pass?}
        QR_OK -->|No| FR[fix-tests\nagent]
        FR --> QR
        QR_OK -->|Yes| BP2
    end

    BP2{Breakpoint\nFinal Review\nlow tolerance}
    BP2 -->|Approved| DONE([Done ✓])
    BP2 -->|Changes| FAIL2([Stop with feedback])
```

## Phase Summary

| Phase | Kind | Description |
|-------|------|-------------|
| update-shared-schemas | agent | Update `@lumora/shared` Zod schemas — persona fields on character, characterId on campaign, remove influencerProfileId from generation, delete persona.ts |
| update-backend-api | agent | Remove `personas` module, update campaign/generation/gallery routes and repos to use characterId |
| db-migration-generate | shell | `pnpm db:generate` — creates migration from current Drizzle schema |
| **BREAKPOINT** | human | Review migration SQL before running (alwaysBreakOn: database-migration) |
| db-migration-run | shell | `pnpm db:migrate` — applies migration |
| update-frontend | agent | Remove Campanhas from sidebar, character-hub 4-tab page, dashboard cards, composables cleanup |
| typecheck | shell | `pnpm typecheck` — all packages green |
| fix-typecheck (if needed) | agent | Fix any TS errors from the migration |
| test-suite | shell | `pnpm test` — all 109 tests pass |
| fix-tests (if needed) | agent | Fix any test failures from schema changes |
| **BREAKPOINT** | human | Final review before closing run |
```
