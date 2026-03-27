export type Element = 'verdant' | 'bloom' | 'thorn' | 'rot' | 'moon' | 'spirit' | 'sun' | 'fungus';
export type SoilType = 'normal' | 'rich' | 'dry' | 'damp' | 'sacred' | 'cursed' | 'radiant' | 'lunar';
export type Phase = 'build' | 'combat' | 'shop';

export interface ContainerDef {
  type: string;
  label: string;
  width: number;
  height: number;
  capacity: number;
  soil: SoilType;
  affinity: string;
  rarity: 'common' | 'uncommon' | 'rare';
  cost: number;
  description: string;
  emoji: string;
  image?: string;
}

export interface PlantDef {
  type: string;
  label: string;
  element: Element;
  basePower: number;
  cooldownMs: number;        // base cooldown in ms (0 = passive/reactive)
  triggerType: 'periodic' | 'on_enemy_attack' | 'passive' | 'start';
  primaryEffect: string;
  description: string;
  emoji: string;
  image?: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  width: number;             // plant width in container grid cells
  height: number;            // plant height in container grid cells
}

export const CONTAINERS: Record<string, ContainerDef> = {
  ClayPot: {
    type: 'ClayPot', label: 'Clay Pot', width: 1, height: 1, capacity: 1,
    soil: 'normal', affinity: 'none', rarity: 'common', cost: 10,
    description: 'A humble pot. Holds 1 plant.', emoji: '🪴',
    image: '/assets/containers/clay_pot.png',
  },
  WoodenPlanter: {
    type: 'WoodenPlanter', label: 'Wooden Planter', width: 2, height: 1, capacity: 2,
    soil: 'normal', affinity: 'none', rarity: 'common', cost: 20,
    description: 'A simple planter. Holds 2 plants.', emoji: '📦',
    image: '/assets/containers/wooden_planter.png',
  },
  GardenBed: {
    type: 'GardenBed', label: 'Garden Bed', width: 3, height: 2, capacity: 6,
    soil: 'normal', affinity: 'none', rarity: 'common', cost: 40,
    description: 'Large bed. Full bonus: +10% power.', emoji: '🛏️',
    image: '/assets/containers/garden_bed.png',
  },
  StoneBasin: {
    type: 'StoneBasin', label: 'Stone Basin', width: 2, height: 2, capacity: 4,
    soil: 'damp', affinity: 'fungus', rarity: 'uncommon', cost: 35,
    description: 'Fungus plants deal 50% more damage.', emoji: '🪨',
    image: '/assets/containers/stone_basin.png',
  },
  DryThornBox: {
    type: 'DryThornBox', label: 'Dry Thorn Box', width: 2, height: 1, capacity: 2,
    soil: 'dry', affinity: 'thorn', rarity: 'uncommon', cost: 30,
    description: 'Thorn plants deal +1 damage.', emoji: '🌵',
    image: '/assets/containers/dry_thorn_box.png',
  },
  RichSoilBed: {
    type: 'RichSoilBed', label: 'Rich Soil Bed', width: 2, height: 2, capacity: 4,
    soil: 'rich', affinity: 'none', rarity: 'uncommon', cost: 45,
    description: 'Plants trigger faster.', emoji: '🌱',
    image: '/assets/containers/rich_soil_bed.png',
  },
  RuneCircle: {
    type: 'RuneCircle', label: 'Rune Circle', width: 2, height: 2, capacity: 4,
    soil: 'sacred', affinity: 'spirit', rarity: 'uncommon', cost: 60,
    description: 'Spirit plants deal +4 damage. Enables spirit recipes.', emoji: '🔮',
    image: '/assets/containers/rune_circle.png',
  },
  LunarPlanter: {
    type: 'LunarPlanter', label: 'Lunar Planter', width: 2, height: 1, capacity: 2,
    soil: 'lunar', affinity: 'moon', rarity: 'uncommon', cost: 55,
    description: 'Moon plants gain mana on trigger.', emoji: '🌙',
    image: '/assets/containers/lunar_planter.png',
  },
  SunBed: {
    type: 'SunBed', label: 'Sun Bed', width: 2, height: 2, capacity: 4,
    soil: 'radiant', affinity: 'sun', rarity: 'uncommon', cost: 65,
    description: 'Sun plants buff neighbors.', emoji: '☀️',
    image: '/assets/containers/sun_bed.png',
  },
  RotPit: {
    type: 'RotPit', label: 'Rot Pit', width: 2, height: 2, capacity: 4,
    soil: 'cursed', affinity: 'rot', rarity: 'uncommon', cost: 50,
    description: 'Rot plants spread poison.', emoji: '☠️',
    image: '/assets/containers/rot_pit.png',
  },
  HangingRack: {
    type: 'HangingRack', label: 'Hanging Rack', width: 1, height: 3, capacity: 3,
    soil: 'normal', affinity: 'none', rarity: 'uncommon', cost: 40,
    description: 'Vertical plants deal more damage.', emoji: '🪝',
    image: '/assets/containers/hanging_rack.png',
  },
  AncientGroveBed: {
    type: 'AncientGroveBed', label: 'Ancient Grove Bed', width: 3, height: 3, capacity: 9,
    soil: 'sacred', affinity: 'none', rarity: 'rare', cost: 120,
    description: '+1 power per plant. Bonus when full. Bonus for mixed elements.', emoji: '🌳',
    image: '/assets/containers/ancient_grove_bed.png',
  },
  SpiritShrine: {
    type: 'SpiritShrine', label: 'Spirit Shrine', width: 2, height: 2, capacity: 4,
    soil: 'sacred', affinity: 'spirit', rarity: 'rare', cost: 90,
    description: 'Spirits are greatly empowered. Entities act faster.', emoji: '👻',
    image: '/assets/containers/spirit_shrine.png',
  },
};

export const PLANTS: Record<string, PlantDef> = {
  // ── 2×1 commons ──────────────────────────────────────────────────────────────
  Moonleaf: {
    type: 'Moonleaf', label: 'Moonleaf', element: 'moon', basePower: 5,
    cooldownMs: 3500, triggerType: 'periodic', primaryEffect: 'heal',
    description: 'Heals grove for 5 every 3.5s.', emoji: '🌿', rarity: 'common',
    width: 2, height: 1, image: '/assets/plants/moonleaf.png',
  },
  Thornvine: {
    type: 'Thornvine', label: 'Thornvine', element: 'thorn', basePower: 8,
    cooldownMs: 2000, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 8 piercing damage every 2s.', emoji: '🌵', rarity: 'common',
    width: 2, height: 1, image: '/assets/plants/thornvine.png',
  },
  Glowcap: {
    type: 'Glowcap', label: 'Glowcap', element: 'fungus', basePower: 2,
    cooldownMs: 4000, triggerType: 'periodic', primaryEffect: 'spore_rot',
    description: 'Applies 2 Spore Rot every 4s. Rot decays enemy for 1 HP/2s per stack.', emoji: '🍄', rarity: 'common',
    width: 2, height: 1, image: '/assets/plants/glowcap.png',
  },
  Rotroot: {
    type: 'Rotroot', label: 'Rotroot', element: 'rot', basePower: 3,
    cooldownMs: 3000, triggerType: 'periodic', primaryEffect: 'spore_rot',
    description: 'Applies 3 Spore Rot every 3s (85% accuracy, 20% crit).', emoji: '🖤', rarity: 'common',
    width: 2, height: 1, image: '/assets/plants/rotroot.png',
  },
  // ── 1×1 passives / reactives ──────────────────────────────────────────────────
  VerdantMoss: {
    type: 'VerdantMoss', label: 'Verdant Moss', element: 'verdant', basePower: 1,
    cooldownMs: 0, triggerType: 'passive', primaryEffect: 'verdant_surge',
    description: 'Passive: grants 1 Verdant Surge at combat start (all plants trigger 2% faster).', emoji: '🌱', rarity: 'common',
    width: 1, height: 1, image: '/assets/plants/verdant_moss.png',
  },
  Duskbloom: {
    type: 'Duskbloom', label: 'Duskbloom', element: 'moon', basePower: 1,
    cooldownMs: 0, triggerType: 'on_enemy_attack', primaryEffect: 'entangle',
    description: 'Reactive: whenever the enemy attacks, Entangle it (pause its next action).', emoji: '🌑', rarity: 'uncommon',
    width: 1, height: 1, image: '/assets/plants/duskbloom.png',
  },
  // ── 1×2 uncommons ──────────────────────────────────────────────────────────────
  Bramble: {
    type: 'Bramble', label: 'Bramble', element: 'thorn', basePower: 10,
    cooldownMs: 1500, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 10 damage + 1 Spore Rot every 1.5s.', emoji: '🌿', rarity: 'uncommon',
    width: 1, height: 2, image: '/assets/plants/bramble.png',
  },
  // ── 2×2 uncommons ──────────────────────────────────────────────────────────────
  Sunblossom: {
    type: 'Sunblossom', label: 'Sunblossom', element: 'sun', basePower: 2,
    cooldownMs: 5000, triggerType: 'periodic', primaryEffect: 'bloom',
    description: 'Grants 2 Bloom every 5s. Bloom adds +1 damage to all attacks.', emoji: '🌻', rarity: 'uncommon',
    width: 2, height: 2, image: '/assets/plants/sunblossom.png',
  },
  SpiritFern: {
    type: 'SpiritFern', label: 'Spirit Fern', element: 'spirit', basePower: 14,
    cooldownMs: 6000, triggerType: 'periodic', primaryEffect: 'spirit_damage',
    description: 'Deals 14 damage with 2 Spirit Essence, or 5 without. Every 6s.', emoji: '✨', rarity: 'uncommon',
    width: 2, height: 2, image: '/assets/plants/spirit_fern.png',
  },
  Rotbriar: {
    type: 'Rotbriar', label: 'Rotbriar', element: 'rot', basePower: 12,
    cooldownMs: 2500, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 12 damage + 4 Spore Rot every 2.5s.', emoji: '🥀', rarity: 'uncommon',
    width: 2, height: 2, image: '/assets/plants/rotbriar.png',
  },
  Dreamcap: {
    type: 'Dreamcap', label: 'Dreamcap', element: 'moon', basePower: 8,
    cooldownMs: 5000, triggerType: 'periodic', primaryEffect: 'heal',
    description: 'Heals 8 HP + applies 3 Spore Rot to enemy every 5s.', emoji: '💫', rarity: 'uncommon',
    width: 2, height: 2, image: '/assets/plants/dreamcap.png',
  },
  RotMass: {
    type: 'RotMass', label: 'Rot Mass', element: 'rot', basePower: 4,
    cooldownMs: 2000, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 4 damage + 1 Wither every 2s (80% accuracy).', emoji: '🫧', rarity: 'uncommon',
    width: 2, height: 2, image: '/assets/plants/rot_mass.png',
  },
  // ── 1×3 rares ──────────────────────────────────────────────────────────────────
  RadiantFlower: {
    type: 'RadiantFlower', label: 'Radiant Flower', element: 'sun', basePower: 5,
    cooldownMs: 4000, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 5 damage + 3 Bloom to grove every 4s.', emoji: '🌺', rarity: 'rare',
    width: 1, height: 3, image: '/assets/plants/radiant_flower.png',
  },
  GroveSpirit: {
    type: 'GroveSpirit', label: 'Grove Spirit', element: 'spirit', basePower: 28,
    cooldownMs: 8000, triggerType: 'periodic', primaryEffect: 'spirit_damage',
    description: 'Deals 28 damage with 4 Spirit Essence, or 11 without. Every 8s.', emoji: '🌟', rarity: 'epic',
    width: 1, height: 3, image: '/assets/plants/grove_spirit.png',
  },
  // ── 3×2 epics ──────────────────────────────────────────────────────────────────
  BriarWraith: {
    type: 'BriarWraith', label: 'Briar Wraith', element: 'rot', basePower: 6,
    cooldownMs: 3000, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 6 damage + steals 1 Regrowth every 3s.', emoji: '👹', rarity: 'rare',
    width: 3, height: 2, image: '/assets/plants/briar_wraith.png',
  },
  LunarDryad: {
    type: 'LunarDryad', label: 'Lunar Dryad', element: 'moon', basePower: 12,
    cooldownMs: 6000, triggerType: 'periodic', primaryEffect: 'heal',
    description: 'Heals 12 HP + grants 2 Regrowth every 6s.', emoji: '🌙', rarity: 'epic',
    width: 3, height: 2, image: '/assets/plants/lunar_dryad.png',
  },
  SunGuardian: {
    type: 'SunGuardian', label: 'Sun Guardian', element: 'sun', basePower: 4,
    cooldownMs: 0, triggerType: 'start', primaryEffect: 'bark_shield',
    description: 'Start of combat: grants 4 Bark Shield + 3 Regrowth.', emoji: '☀️', rarity: 'legendary',
    width: 3, height: 2, image: '/assets/plants/sun_guardian.png',
  },
  // ── New 2×1 commons ───────────────────────────────────────────────────────────
  Foxglove: {
    type: 'Foxglove', label: 'Foxglove', element: 'moon', basePower: 4,
    cooldownMs: 3500, triggerType: 'periodic', primaryEffect: 'heal',
    description: 'Heals 4 HP + applies 1 Spore Rot every 3.5s.', emoji: '🌺', rarity: 'common',
    width: 2, height: 1, image: '/assets/plants/foxglove.png',
  },
  BrambleSeed: {
    type: 'BrambleSeed', label: 'Bramble Seed', element: 'thorn', basePower: 6,
    cooldownMs: 2500, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 6 damage every 2.5s (15% crit).', emoji: '🌿', rarity: 'common',
    width: 2, height: 1, image: '/assets/plants/bramble_seed.png',
  },
  SunSprout: {
    type: 'SunSprout', label: 'Sun Sprout', element: 'sun', basePower: 3,
    cooldownMs: 0, triggerType: 'start', primaryEffect: 'bloom',
    description: 'Start of combat: grants 3 Bloom. Bloom adds +1 to all damage.', emoji: '🌻', rarity: 'common',
    width: 2, height: 1, image: '/assets/plants/sun_sprout.png',
  },
  // ── New 1×1 commons ───────────────────────────────────────────────────────────
  SporePuff: {
    type: 'SporePuff', label: 'Spore Puff', element: 'fungus', basePower: 2,
    cooldownMs: 4000, triggerType: 'periodic', primaryEffect: 'spore_rot',
    description: 'Applies 2 Spore Rot every 4s (20% crit for bonus stack).', emoji: '🍄', rarity: 'common',
    width: 1, height: 1, image: '/assets/plants/spore_puff.png',
  },
  WiltingGrass: {
    type: 'WiltingGrass', label: 'Wilting Grass', element: 'rot', basePower: 2,
    cooldownMs: 0, triggerType: 'passive', primaryEffect: 'wither',
    description: 'Passive: grants 2 Wither at combat start, reducing enemy attack damage.', emoji: '🥀', rarity: 'common',
    width: 1, height: 1, image: '/assets/plants/wilting_grass.png',
  },
  IceFrond: {
    type: 'IceFrond', label: 'Ice Frond', element: 'verdant', basePower: 1,
    cooldownMs: 0, triggerType: 'on_enemy_attack', primaryEffect: 'root_chill',
    description: 'Reactive: applies 1 Root Chill whenever the enemy attacks.', emoji: '🌾', rarity: 'common',
    width: 1, height: 1, image: '/assets/plants/ice_frond.png',
  },
  // ── New 2×1 uncommons ─────────────────────────────────────────────────────────
  NettleVine: {
    type: 'NettleVine', label: 'Nettle Vine', element: 'thorn', basePower: 9,
    cooldownMs: 2500, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 9 damage + 2 Spore Rot every 2.5s (95% acc).', emoji: '🌵', rarity: 'uncommon',
    width: 2, height: 1, image: '/assets/plants/nettle_vine.png',
  },
  MireMoss: {
    type: 'MireMoss', label: 'Mire Moss', element: 'rot', basePower: 5,
    cooldownMs: 3000, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 5 damage + 2 Wither every 3s (85% acc, 15% crit).', emoji: '🟤', rarity: 'uncommon',
    width: 2, height: 1, image: '/assets/plants/mire_moss.png',
  },
  // ── New 2×2 uncommons ─────────────────────────────────────────────────────────
  GreymossTree: {
    type: 'GreymossTree', label: 'Greymoss Tree', element: 'moon', basePower: 2,
    cooldownMs: 0, triggerType: 'passive', primaryEffect: 'regrowth',
    description: 'Passive: grants 2 Regrowth at combat start (heals 2 HP/2s).', emoji: '🌲', rarity: 'uncommon',
    width: 2, height: 2, image: '/assets/plants/greymoss_tree.png',
  },
  // ── New 1×2 uncommons ─────────────────────────────────────────────────────────
  CrimsonPetal: {
    type: 'CrimsonPetal', label: 'Crimson Petal', element: 'sun', basePower: 6,
    cooldownMs: 3500, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 6 damage + 2 Bloom every 3.5s (10% crit).', emoji: '🌸', rarity: 'uncommon',
    width: 1, height: 2, image: '/assets/plants/crimson_petal.png',
  },
  ChillFern: {
    type: 'ChillFern', label: 'Chill Fern', element: 'verdant', basePower: 3,
    cooldownMs: 4000, triggerType: 'periodic', primaryEffect: 'root_chill',
    description: 'Applies 3 Root Chill every 4s, heavily slowing enemy attacks.', emoji: '🪴', rarity: 'uncommon',
    width: 1, height: 2, image: '/assets/plants/chill_fern.png',
  },
  // ── New 1×1 uncommons ─────────────────────────────────────────────────────────
  SporeHusk: {
    type: 'SporeHusk', label: 'Spore Husk', element: 'fungus', basePower: 2,
    cooldownMs: 0, triggerType: 'passive', primaryEffect: 'spore_rot',
    description: 'Passive: grants 2 Spore Rot stacks at combat start.', emoji: '💀', rarity: 'uncommon',
    width: 1, height: 1,
  },
  ReactiveVine: {
    type: 'ReactiveVine', label: 'Reactive Vine', element: 'thorn', basePower: 6,
    cooldownMs: 0, triggerType: 'on_enemy_attack', primaryEffect: 'damage',
    description: 'Reactive: whenever the enemy attacks, strikes back for 6 + 1 Spore Rot.', emoji: '⚡', rarity: 'uncommon',
    width: 1, height: 1,
  },
  // ── New 2×2 rares ─────────────────────────────────────────────────────────────
  ToxicThorn: {
    type: 'ToxicThorn', label: 'Toxic Thorn', element: 'thorn', basePower: 14,
    cooldownMs: 2000, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 14 damage + 3 Spore Rot every 2s (90% acc, 20% crit).', emoji: '☠️', rarity: 'rare',
    width: 2, height: 2, image: '/assets/plants/toxic_thorn.png',
  },
  VenomCore: {
    type: 'VenomCore', label: 'Venom Core', element: 'rot', basePower: 8,
    cooldownMs: 2000, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 8 damage + 5 Spore Rot every 2s (85% acc, 25% crit).', emoji: '🐍', rarity: 'rare',
    width: 2, height: 2, image: '/assets/plants/venom_core.png',
  },
  SunForge: {
    type: 'SunForge', label: 'Sun Forge', element: 'sun', basePower: 10,
    cooldownMs: 4000, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 10 damage + 4 Bloom every 4s (15% crit).', emoji: '🔥', rarity: 'rare',
    width: 2, height: 2, image: '/assets/plants/sun_forge.png',
  },
  FrostRoot: {
    type: 'FrostRoot', label: 'Frost Root', element: 'verdant', basePower: 4,
    cooldownMs: 3000, triggerType: 'periodic', primaryEffect: 'root_chill',
    description: 'Applies 4 Root Chill + 2 Wither every 3s (90% acc). Stacks slow enemy hard.', emoji: '❄️', rarity: 'rare',
    width: 2, height: 2, image: '/assets/plants/frost_root.png',
  },
  BarkcladShield: {
    type: 'BarkcladShield', label: 'Barkclad Shield', element: 'moon', basePower: 6,
    cooldownMs: 0, triggerType: 'start', primaryEffect: 'bark_shield',
    description: 'Start of combat: grants 6 Bark Shield + 3 Regrowth.', emoji: '🛡️', rarity: 'rare',
    width: 2, height: 2, image: '/assets/plants/barkcald_shield.png',
  },
  // ── New 3×2 epics ─────────────────────────────────────────────────────────────
  ThornsWraith: {
    type: 'ThornsWraith', label: 'Thorns Wraith', element: 'thorn', basePower: 6,
    cooldownMs: 0, triggerType: 'passive', primaryEffect: 'thorns',
    description: 'Passive: grants 6 Thorns at combat start. Reflects damage back on enemy attacks.', emoji: '👻', rarity: 'epic',
    width: 3, height: 2, image: '/assets/plants/thorns_wraith.png',
  },
  PlagueRoot: {
    type: 'PlagueRoot', label: 'Plague Root', element: 'rot', basePower: 15,
    cooldownMs: 2500, triggerType: 'periodic', primaryEffect: 'damage',
    description: 'Deals 15 damage + 6 Spore Rot every 2.5s (80% acc, 20% crit). High risk, high rot.', emoji: '🫀', rarity: 'rare',
    width: 3, height: 2, image: '/assets/plants/plague_root.png',
  },
};

export interface EffectMeta {
  label: string;
  emoji: string;
  color: string;
  description: string;
}

export const EFFECT_META: Record<string, EffectMeta> = {
  spore_rot:     { label: 'Spore Rot',    emoji: '🍄', color: '#a855f7',
    description: 'Deals 1 damage to the enemy per stack every 2s. Each tick decays 1 stack.' },
  regrowth:      { label: 'Regrowth',     emoji: '🌿', color: '#4ade80',
    description: 'Restores 1 HP to the grove per stack every 2s.' },
  bark_shield:   { label: 'Bark Shield',  emoji: '🪵', color: '#a16207',
    description: 'Absorbs incoming enemy damage (1 per stack) before HP is reduced. Consumed on hit.' },
  bloom:         { label: 'Bloom',        emoji: '🌸', color: '#f472b6',
    description: 'Adds +1 damage to every plant attack per stack.' },
  verdant_surge: { label: 'Verd. Surge',  emoji: '💨', color: '#86efac',
    description: 'Reduces all periodic plant cooldowns by 2% per stack.' },
  thorns:        { label: 'Thorns',       emoji: '🌵', color: '#86efac',
    description: 'Reflects damage back at the enemy on each of its attacks, up to its attack value.' },
  wither:        { label: 'Wither',       emoji: '💀', color: '#6b7280',
    description: 'Reduces enemy attack damage by 1 per stack.' },
  root_chill:    { label: 'Root Chill',   emoji: '❄️', color: '#93c5fd',
    description: 'Slows the enemy\'s attack cooldown by 10% per stack.' },
  entangle:      { label: 'Entangle',     emoji: '🕸️', color: '#fbbf24',
    description: 'Cancels the enemy\'s next attack entirely. All stacks consumed at once.' },
};

export const ELEMENT_COLORS: Record<string, string> = {
  verdant: '#4ade80',
  bloom: '#f472b6',
  thorn: '#86efac',
  rot: '#a855f7',
  moon: '#93c5fd',
  spirit: '#e9d5ff',
  sun: '#fbbf24',
  fungus: '#d97706',
};

export const ELEMENT_GLOW: Record<string, string> = {
  verdant: '0 0 12px #4ade8088',
  bloom: '0 0 12px #f472b688',
  thorn: '0 0 12px #86efac88',
  rot: '0 0 12px #a855f788',
  moon: '0 0 14px #93c5fdaa',
  spirit: '0 0 16px #e9d5ffaa',
  sun: '0 0 14px #fbbf24aa',
  fungus: '0 0 12px #d9770688',
};

export const SOIL_COLORS: Record<string, string> = {
  normal: '#3d2b1f',
  rich: '#2d4a1e',
  dry: '#5c3d2e',
  damp: '#1a3a2e',
  sacred: '#2a1f4a',
  cursed: '#2a1a1a',
  radiant: '#4a3a1a',
  lunar: '#1a2a4a',
};
