# Grovekeeper — CLAUDE.md

## What This Is
A roguelite auto-battler. Player arranges plants in containers on a garden board; plants auto-attack during combat against enemies. Built with SpacetimeDB (Rust server) + Vite/React/TypeScript client.

---

## Repo Layout
```
grovekeeper/
  server/src/lib.rs        # All server logic (single file, ~1500 lines)
  client/src/
    App.tsx                # Root: DnD context, layout, phase/button logic
    game/data.ts           # ALL client-side static data (plants, containers, effects)
    hooks/useGrovekeeper.ts # SpacetimeDB state + all reducer callbacks
    components/
      GardenBoard.tsx      # Board grid + container/plant drag-drop rendering
      ShopView.tsx         # Shop offers + reroll button + PlantTooltipContent/ContainerTooltipContent (exported)
      StorageShelf.tsx     # Stash (inventory) items, drag to board or to place
      CombatView.tsx       # Enemy card, effects, log
      Toolbar.tsx          # (minor)
      Tooltip.tsx          # Generic hover popover via createPortal
    module_bindings/
      types.ts             # TS types for ALL SpacetimeDB rows
      client.ts            # GroveKeeperClient class (hand-written, NOT generated)
      index.ts             # Generated: table/reducer schema registration
      player_table.ts      # Generated table schemas (one file per table/reducer)
      *_reducer.ts         # Stub files (export default {}) for reducer registration
```

---

## Server Architecture (`server/src/lib.rs`)

### Tables
| Table | Key fields |
|-------|-----------|
| `Player` | identity, hp, max_hp, currency, phase ("build"\|"combat"), round, reroll_count |
| `ContainerOnBoard` | id, owner, container_type, x, y, width, height, capacity, soil_type, affinity |
| `PlantInContainer` | id, owner, plant_type, container_id, slot_index, element, cooldown_ms, trigger_type, primary_effect, primary_value, secondary_effect, secondary_value, accuracy, crit_chance, trigger_count |
| `CombatState` | owner, enemy_name, enemy_hp, enemy_max_hp, enemy_attack, enemy_cooldown_ms, tick, status ("active"\|"victory"\|"defeat"), spirit_essence, fatigue_active, fatigue_damage, clock_ticks, start_timestamp_us |
| `CombatLogEntry` | id, owner, tick, message, entry_type |
| `ActiveEffect` | id, owner, target ("player"\|"enemy"), effect, stacks |
| `Inventory` | id, owner, item_category ("plant"\|"container"), item_type |
| `ShopOffer` | id, owner, item_category, item_type, cost, purchased, rarity |
| `PlantTriggerSchedule` | id, owner, plant_id, scheduled_at |
| `EnemyAttackSchedule` | id, owner, scheduled_at |
| `CombatClockSchedule` | id, owner, scheduled_at |

### Reducers
| Reducer | Phase | What it does |
|---------|-------|-------------|
| `client_connected` | any | Init player on first connect; repopulate shop if build+empty |
| `place_container` | build | Place container type at (x,y) on board |
| `move_container` | build | Move placed container |
| `remove_container` | build | Stash container + all its plants to inventory |
| `place_plant` | build | Place plant type into container slot |
| `remove_plant` | build | Stash plant to inventory |
| `place_from_inventory` | build | Place inventory container onto board |
| `place_plant_from_inventory` | build | Place inventory plant into slot |
| `move_plant` | build | Move plant between slots |
| `buy_item` | build | Deduct currency, add to inventory |
| `reroll_shop` | build | Cost=(reroll_count+1)×10 Sap; new shop seed; increments reroll_count |
| `finish_shopping` | build | (no-op currently) |
| `start_combat` | build | Creates CombatState, schedules plant/enemy/clock timers, sets phase="combat" |
| `plant_trigger` | combat | Fires plant effect, reschedules if periodic |
| `enemy_attack` | combat | Enemy attacks, handles reactions/thorns, reschedules |
| `combat_clock_tick` | combat | Every 2s: spore_rot tick, regrowth tick, fatigue (after 13 ticks) |
| `return_to_grove` | combat | Sets phase="build", reroll_count=0 (called after victory/defeat) |
| `reset_run` | any | Wipes everything, resets to round 1 |

### Key Helper Functions
- `plant_data(plant_type)` → `PlantStats` struct (ALL plant stats live here)
- `container_data(container_type)` → (width, height, capacity, cost, soil, affinity)
- `make_plant(identity, plant_type, container_id, slot_index)` → `PlantInContainer`
- `apply_plant_effect(ctx, identity, plant, combat, player, tick)` → (CombatState, Player)
- `populate_shop(ctx, identity, round, tick)` — deletes offers, seeds RNG from tick+round, picks 2 containers + 3 plants
- `shop_pool_for_round(round)` — round 1: 4 containers + 14 plants; round 2+: +11 containers +11 plants; round 4+: +5 containers +12 plants
- `log_entry(ctx, identity, tick, start_us, message, entry_type)` — prefixes "[+X.XXs]"
- `clear_combat_schedules(ctx, identity)` — deletes all 3 schedule types for owner
- `enemy_for_round(round)` → enemy stats

### Effects Routing in `apply_plant_effect`
- **→ enemy**: damage, spirit_damage, spore_rot, wither, root_chill, entangle
- **→ player**: heal, regrowth, bark_shield, bloom, verdant_surge, thorns
- Secondary effects: spore_rot→enemy, bloom/regrowth→player, wither/root_chill→enemy

### Scheduling Pattern
**CRITICAL**: Use `ScheduleAt::Time(ctx.timestamp + Duration::from_millis(ms))` — NOT `Interval`. Interval is repeating (row persists); Time is one-shot (row deleted after fire). Manual reschedule inside reducer = correct chain.

### Adding a New Plant
1. Add to `plant_data()` match in `lib.rs`
2. Add to `shop_pool_for_round()` at appropriate round tier
3. Add to `PLANTS` in `client/src/game/data.ts`

### Adding a New Reducer
1. Write `pub fn foo(ctx: &ReducerContext, ...) -> Result<(), String>` in `lib.rs`
2. Create `client/src/module_bindings/foo_reducer.ts` (stub: `export default {};`)
3. In `index.ts`: import + add `__reducerSchema("foo", FooReducer)`
4. In `client.ts`: add `foo(...) { this.conn?.reducers.foo({...}); }`
5. In `useGrovekeeper.ts`: add `useCallback` + include in return
6. If args don't match TS types: use `(this.conn?.reducers as any)?.foo(...)`

---

## Client Architecture

### State Flow
SpacetimeDB → `client.ts` callbacks → `useGrovekeeper.ts` useState → component props

### Key Patterns
- **Drag data kinds**: `'inventory-container'`, `'inventory-plant'`, `'placed-container'`, `'placed-plant'`
- **Drop targets**: `cell:X:Y` (board grid cells), `slot:containerId:slotIndex`, `'stash'` (StorageShelf)
- **Phase gates**: `isBuild = player.phase === 'build'`, `isCombat = player.phase === 'combat'`
- **bigint**: SpacetimeDB IDs are `u64` → TypeScript `bigint`. Use `BigInt(str)` to convert.
- **Reducers not in generated types**: cast `(this.conn?.reducers as any)?.reducerName(...)`

### Tooltip System
`<Tooltip content={<ReactNode>}>{child}</Tooltip>` — renders via `createPortal` into `document.body`, fixed position near cursor, auto-flips at right edge. Import from `components/Tooltip.tsx`.

Rich tooltip content components (exported from `ShopView.tsx`):
- `<PlantTooltipContent def={PlantDef} />`
- `<ContainerTooltipContent def={ContainerDef} />`

### data.ts Exports
- `PLANTS: Record<string, PlantDef>` — all plant UI data
- `CONTAINERS: Record<string, ContainerDef>` — all container UI data
- `EFFECT_META: Record<string, EffectMeta>` — effect labels, emojis, colors, descriptions
- `ELEMENT_COLORS`, `ELEMENT_GLOW`, `SOIL_COLORS` — styling maps

### module_bindings/types.ts
Single source of truth for all row TypeScript types. Hand-maintained to match server structs. When adding a server field, update both `types.ts` AND the corresponding `*_table.ts`.

---

## Combat Flow
1. `start_combat` → clears old schedules/effects, inserts CombatState, schedules timers
2. `plant_trigger` fires per plant (periodic), `enemy_attack` fires on enemy timer, `combat_clock_tick` fires every 2s
3. All three check `combat.status == "active"` at top — bail if not
4. Victory/defeat: update CombatState.status, increment round, call `populate_shop`, call `clear_combat_effects` — do NOT set phase="build" (player must call `return_to_grove`)
5. `return_to_grove` → phase="build", reroll_count=0

---

## Compile / Check Commands
```bash
# Server
cd server && cargo check

# Client type-check
cd client && npx tsc --noEmit

# Client build
cd client && npm run build
```

---

## Things NOT to Do
- Don't use `ScheduleAt::Interval` — it repeats; use `ScheduleAt::Time`
- Don't set `phase: "build"` inside victory/defeat handlers — `return_to_grove` does this
- Don't call `clear_combat_schedules` inside victory/defeat — schedules bail on status check
- Don't add `reroll_count` reset inside `populate_shop` — reset happens in `return_to_grove`
- Don't generate or regenerate `module_bindings/` with CLI — files are hand-maintained
