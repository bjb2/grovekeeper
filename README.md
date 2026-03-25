# Grovekeeper

A mystical garden-building auto-battler. Cultivate enchanted plants, place magical containers, and defend your sacred grove from corruption.

## Stack

- **Frontend**: Vite + React + TypeScript → deployed on Vercel
- **Backend**: SpacetimeDB (Rust module) → deployed on SpacetimeDB Cloud

---

## Quick Start

### 1. Deploy the SpacetimeDB Module

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

### 2. Run the Client Locally

```bash
cd client
cp .env.example .env
# Edit .env — set VITE_SPACETIME_MODULE to your published module name
npm install
npm run dev
```

### 3. Deploy to Vercel

```bash
# From repo root
vercel deploy
```

Set environment variables in Vercel dashboard:
- `VITE_SPACETIME_HOST` = `wss://maincloud.spacetimedb.com`
- `VITE_SPACETIME_MODULE` = `grovekeeper` (or your module name)

### 4. Regenerate TypeScript Bindings (after server changes)

```bash
cd client
npm run generate
```

---

## Gameplay

1. **Build Phase** — Select containers from the toolbar and place them on the 10×10 garden grid. Then select plants and click empty slots inside containers.
2. **Combat Phase** — Click "Begin Encounter". Your grove automatically attacks each tick. Watch the combat log.
3. **Shop Phase** — After victory, spend Sap on new containers and plants, then return to your grove.

### Elements
| Element | Color | Notes |
|---------|-------|-------|
| 🌿 Verdant | Green | Basic |
| 🌵 Thorn | Light green | High damage; bonus in Dry Thorn Box |
| 🍄 Fungus | Orange | 50% bonus in Stone Basin |
| 🌙 Moon | Blue | Mana regen in Lunar Planter |
| ✨ Spirit | Purple | Strongest in Rune Circle / Spirit Shrine |
| ☀️ Sun | Gold | Buffs neighbors in Sun Bed |
| 🖤 Rot | Dark purple | Spreads poison in Rot Pit |
| 🌸 Bloom | Pink | |

### Soil Synergies
Each container has a soil type. Plants whose element matches the soil get +2 power.

### Container Bonuses
- **Garden Bed** — Full capacity = +10% power for all plants inside
- **Stone Basin** — Fungus plants deal 50% more damage
- **Rune Circle** — Spirit plants deal +4 damage
- **Dry Thorn Box** — Thorn plants deal +1 damage

---

## Project Structure

```
grovekeeper/
  server/          # SpacetimeDB Rust module
    src/lib.rs     # Tables + reducers
    Cargo.toml
  client/          # Vite + React frontend
    src/
      module_bindings/  # SpacetimeDB TypeScript bindings
      game/data.ts      # Game constants (plants, containers)
      hooks/            # useGrovekeeper React hook
      components/       # GardenBoard, Toolbar, CombatView, ShopView
      styles/
    .env.example
  vercel.json      # Vercel deployment config
```
