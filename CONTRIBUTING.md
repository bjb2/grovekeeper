# Contributing to Grovekeeper

Welcome to the grove. Whether you're tending a bug, planting a new feature, or pruning the codebase — every contribution helps the garden grow.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [SpacetimeDB CLI](https://spacetimedb.com/install) (for server development)
- Rust toolchain (for server development)

### Local Setup

```bash
git clone https://github.com/bjb2/grovekeeper.git
cd grovekeeper

# Client
cd client
npm install
npm run dev
```

For server changes, see the [SpacetimeDB docs](https://spacetimedb.com/docs) for publishing modules.

## Architecture at a Glance

Read `CLAUDE.md` for the full technical architecture. The short version:

| Layer | Tech | Location |
|-------|------|----------|
| Server | Rust + SpacetimeDB | `server/src/lib.rs` |
| Client | React + TypeScript + Vite | `client/src/` |
| Game Data | Static definitions | `client/src/game/data.ts` |
| Drag & Drop | @dnd-kit | `client/src/components/` |
| State Sync | SpacetimeDB WebSocket | `client/src/hooks/useGrovekeeper.ts` |

All game logic runs server-side. The client renders state and sends actions.

## How to Contribute

### Reporting Bugs

Open an issue with:
- What you expected vs. what happened
- Browser and device info (especially for mobile)
- Screenshots or screen recordings if relevant
- Console errors if any

### Suggesting Features

Open an issue describing:
- **New plants/containers**: element, trigger type, effects, and balance reasoning
- **UI improvements**: mockups or descriptions
- **Game mechanics**: how they interact with existing systems (combat, shop, effects)

### Submitting Code

1. Fork the repo and create a branch from `main`
2. **Read `CLAUDE.md`** — it contains critical architecture notes and hard-won "don't do this" patterns
3. Follow existing code patterns:
   - Inline React styles (not CSS modules)
   - SpacetimeDB reducers for all game state mutations
   - Plant/container data in `data.ts` (client) and `plant_data()`/`container_data()` (server)
4. Type-check and build:
   ```bash
   cd client && npx tsc --noEmit
   cd client && npm run build
   ```
5. Open a PR with a clear description of what changed and why

### Adding a New Plant

1. Add stats to `plant_data()` in `server/src/lib.rs`
2. Add to `shop_pool_for_round()` at the appropriate round tier
3. Add the `PlantDef` entry in `client/src/game/data.ts`
4. Add artwork to `public/assets/plants/` (PNG, transparent background)

### Adding a New Container

Same pattern: server `container_data()`, shop pool, client `CONTAINERS` in `data.ts`, artwork in `public/assets/containers/`.

## Code Conventions

- **TypeScript**: Strict mode enabled. Avoid `any` where possible.
- **Components**: Functional, with hooks for state
- **Styling**: Inline styles on React elements (the codebase does not use CSS modules)
- **Naming**: PascalCase components, camelCase functions and variables
- **Module bindings**: Hand-maintained in `client/src/module_bindings/` — do **not** auto-generate with the CLI

## Patterns to Avoid

These have caused real bugs. See `CLAUDE.md` for full context:

- **`ScheduleAt::Interval`** — always use `ScheduleAt::Time` with manual reschedule
- **Setting `phase: "build"` in victory/defeat handlers** — `return_to_grove` handles phase transitions
- **Auto-generating `module_bindings/`** — the files are hand-tuned and will break

## Review Process

- PRs should be focused: one feature or fix per PR
- Include a description of what changed and how to test it
- Screenshots for UI changes are appreciated
- Server changes should include the reasoning for balance decisions

## Community

Be kind. Be constructive. We're all here because we like plants that fight things.

---

*"Every seed is a story waiting to root."*
