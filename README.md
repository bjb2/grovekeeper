# Grovekeeper

A roguelite auto-battler where you cultivate enchanted plants and defend your sacred grove from corruption. Arrange plants in containers on a garden board — then watch them fight for you.

**Stack:** SpacetimeDB (Rust) · Vite · React · TypeScript

---

## Gameplay Loop

There are two phases: **build** and **combat**.

### Build Phase
Arrange containers on the 10×10 garden grid and fill them with plants from your inventory. The shop is always visible during build — spend Sap (💛) on new containers and plants, and drag purchases straight from inventory onto the board. Rerolling the shop costs `(rerolls_this_round + 1) × 10` Sap and resets each round.

When your board is ready, click **Begin Encounter**.

### Combat Phase
Both sides fight automatically. Your plants fire on their own cooldown timers; the enemy's plants do the same on their side of the board. A clock ticks every 2 seconds, driving Spore Rot damage and Regrowth healing. If the fight drags past ~26 seconds, **fatigue** sets in and deals escalating damage to both sides.

Combat ends when one side reaches 0 HP:

- **Victory** — click **Return to Grove**. You advance to the next round, the shop refreshes with a wider item pool, and the reroll counter resets.
- **Defeat** — click **New Run**. Everything resets to round 1.

Enemies scale each round. The shop pool also expands — more container and plant options unlock at rounds 2 and 4.

---

## Plants & Elements

| Element | Plants | Playstyle |
|---------|--------|-----------|
| 🌿 Verdant | Fern, Clover, Mosscap | Balanced, sustain-focused |
| 🌵 Thorn | Cactus, Briar, Needleleaf | High single-target damage |
| 🍄 Fungus | Sporecap, Rotshroom, Gloomcap | Damage-over-time via Spore Rot |
| 🌙 Moon | Lunabloom, Duskpetal | Healing and regrowth |
| ✨ Spirit | Runebloom, Soulvine | Spirit damage, strongest in rune containers |
| ☀️ Sun | Sunleaf, Emberpetal | Buffs and surges |
| 🖤 Rot | Witherbloom, Plaguestem | Wither debuffs, spreading poison |
| 🌸 Bloom | Rosewick, Blushcap | Bloom healing bursts |

Plants deal damage, apply status effects (Spore Rot, Wither, Root Chill, Entangle), or buff your grove (Regrowth, Bark Shield, Bloom, Verdant Surge, Thorns).

---

## Containers & Soil

Each container has a **soil type** and **affinity**. Plants whose element matches the soil get **+2 power**. Some containers add bonus effects:

| Container | Bonus |
|-----------|-------|
| Garden Bed | Full capacity → +10% power to all plants inside |
| Stone Basin | Fungus plants deal 50% more damage |
| Rune Circle | Spirit plants deal +4 damage |
| Dry Thorn Box | Thorn plants deal +1 damage |
| Lunar Planter | Moon affinity soil |
| Spirit Shrine | Spirit affinity soil |
| Rot Pit | Rot affinity soil |

---

## Running Locally

### 1. Publish the server module

Install the SpacetimeDB CLI:
```bash
curl -sSf https://install.spacetimedb.com | sh
```

Login and publish:
```bash
spacetime login
cd server
spacetime publish grovekeeper --server maincloud.spacetimedb.com
```

### 2. Run the client

```bash
cd client
cp .env.example .env        # set VITE_SPACETIME_MODULE to your module name
npm install
npm run dev
```

### 3. Type-check / build

```bash
# Type check server
cd server && cargo check

# Type check client
cd client && npx tsc --noEmit

# Production build
cd client && npm run build
```

---

## Deploying to Vercel

```bash
vercel deploy
```

Set these environment variables in the Vercel dashboard:

| Variable | Value |
|----------|-------|
| `VITE_SPACETIME_HOST` | `wss://maincloud.spacetimedb.com` |
| `VITE_SPACETIME_MODULE` | `grovekeeper` (or your module name) |

---

## Project Structure

```
grovekeeper/
├── server/
│   ├── src/lib.rs        # All game logic — tables, reducers, combat engine
│   └── Cargo.toml
└── client/
    └── src/
        ├── App.tsx                    # Root layout, drag-and-drop, phase logic
        ├── game/data.ts               # Static data — all plants, containers, effects
        ├── hooks/
        │   ├── useGrovekeeper.ts      # SpacetimeDB state + reducer callbacks
        │   └── useSound.ts            # Web Audio API — music + SFX
        ├── components/
        │   ├── GardenBoard.tsx        # Player board with drag-drop
        │   ├── EnemyBoard.tsx         # Enemy board (read-only during combat)
        │   ├── ShopView.tsx           # Shop offers, reroll, tooltips
        │   ├── StorageShelf.tsx       # Inventory stash
        │   ├── CombatView.tsx         # Enemy HP, effects, combat log
        │   └── Tooltip.tsx            # Portal-based hover tooltips
        └── module_bindings/           # Hand-maintained SpacetimeDB TS bindings
```

---

## Tech Notes

- **SpacetimeDB** handles all authoritative game state — no REST API, no polling. The client subscribes to table changes over WebSocket and reacts in real time.
- **Combat** is fully server-side: plant triggers, enemy attacks, and clock ticks are scheduled as one-shot `ScheduleAt::Time` reducers that chain themselves.
- **Drag and drop** uses `@dnd-kit`. Containers support rotation (R key or right-click during drag).
- **Module bindings** in `client/src/module_bindings/` are hand-maintained — do not regenerate with the CLI.
- **Sound** is synthesized at runtime with the Web Audio API (no audio assets). Music and SFX have independent mute controls in the header.
