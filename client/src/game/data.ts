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
}

export interface PlantDef {
  type: string;
  label: string;
  element: Element;
  basePower: number;
  description: string;
  emoji: string;
}

export const CONTAINERS: Record<string, ContainerDef> = {
  ClayPot: {
    type: 'ClayPot', label: 'Clay Pot', width: 1, height: 1, capacity: 1,
    soil: 'normal', affinity: 'none', rarity: 'common', cost: 10,
    description: 'A humble pot. Holds 1 plant.', emoji: '🪴',
  },
  WoodenPlanter: {
    type: 'WoodenPlanter', label: 'Wooden Planter', width: 2, height: 1, capacity: 2,
    soil: 'normal', affinity: 'none', rarity: 'common', cost: 20,
    description: 'A simple planter. Holds 2 plants.', emoji: '📦',
  },
  GardenBed: {
    type: 'GardenBed', label: 'Garden Bed', width: 3, height: 2, capacity: 6,
    soil: 'normal', affinity: 'none', rarity: 'common', cost: 40,
    description: 'Large bed. Full bonus: +10% power.', emoji: '🛏️',
  },
  StoneBasin: {
    type: 'StoneBasin', label: 'Stone Basin', width: 2, height: 2, capacity: 2,
    soil: 'damp', affinity: 'fungus', rarity: 'uncommon', cost: 35,
    description: 'Fungus plants deal 50% more damage.', emoji: '🪨',
  },
  DryThornBox: {
    type: 'DryThornBox', label: 'Dry Thorn Box', width: 2, height: 1, capacity: 2,
    soil: 'dry', affinity: 'thorn', rarity: 'uncommon', cost: 30,
    description: 'Thorn plants deal +1 damage.', emoji: '🌵',
  },
  RichSoilBed: {
    type: 'RichSoilBed', label: 'Rich Soil Bed', width: 2, height: 2, capacity: 4,
    soil: 'rich', affinity: 'none', rarity: 'uncommon', cost: 45,
    description: 'Plants trigger faster.', emoji: '🌱',
  },
  RuneCircle: {
    type: 'RuneCircle', label: 'Rune Circle', width: 2, height: 2, capacity: 3,
    soil: 'sacred', affinity: 'spirit', rarity: 'uncommon', cost: 60,
    description: 'Spirit plants deal +4 damage. Enables spirit recipes.', emoji: '🔮',
  },
  LunarPlanter: {
    type: 'LunarPlanter', label: 'Lunar Planter', width: 2, height: 1, capacity: 2,
    soil: 'lunar', affinity: 'moon', rarity: 'uncommon', cost: 55,
    description: 'Moon plants gain mana on trigger.', emoji: '🌙',
  },
  SunBed: {
    type: 'SunBed', label: 'Sun Bed', width: 2, height: 2, capacity: 4,
    soil: 'radiant', affinity: 'sun', rarity: 'uncommon', cost: 65,
    description: 'Sun plants buff neighbors.', emoji: '☀️',
  },
  RotPit: {
    type: 'RotPit', label: 'Rot Pit', width: 2, height: 2, capacity: 3,
    soil: 'cursed', affinity: 'rot', rarity: 'uncommon', cost: 50,
    description: 'Rot plants spread poison.', emoji: '☠️',
  },
  HangingRack: {
    type: 'HangingRack', label: 'Hanging Rack', width: 1, height: 3, capacity: 3,
    soil: 'normal', affinity: 'none', rarity: 'uncommon', cost: 40,
    description: 'Vertical plants deal more damage.', emoji: '🪝',
  },
  AncientGroveBed: {
    type: 'AncientGroveBed', label: 'Ancient Grove Bed', width: 3, height: 3, capacity: 9,
    soil: 'sacred', affinity: 'none', rarity: 'rare', cost: 120,
    description: '+1 power per plant. Bonus when full. Bonus for mixed elements.', emoji: '🌳',
  },
  SpiritShrine: {
    type: 'SpiritShrine', label: 'Spirit Shrine', width: 2, height: 2, capacity: 2,
    soil: 'sacred', affinity: 'spirit', rarity: 'rare', cost: 90,
    description: 'Spirits are greatly empowered. Entities act faster.', emoji: '👻',
  },
};

export const PLANTS: Record<string, PlantDef> = {
  Moonleaf: {
    type: 'Moonleaf', label: 'Moonleaf', element: 'moon', basePower: 8,
    description: 'Heals the grove for 2 each turn.', emoji: '🌿',
  },
  Thornvine: {
    type: 'Thornvine', label: 'Thornvine', element: 'thorn', basePower: 12,
    description: 'Deals piercing thorn damage.', emoji: '🌵',
  },
  Glowcap: {
    type: 'Glowcap', label: 'Glowcap', element: 'fungus', basePower: 10,
    description: 'Fungal spores deal damage over time.', emoji: '🍄',
  },
  Sunblossom: {
    type: 'Sunblossom', label: 'Sunblossom', element: 'sun', basePower: 9,
    description: 'Buffs adjacent plants with solar energy.', emoji: '🌻',
  },
  Rotroot: {
    type: 'Rotroot', label: 'Rotroot', element: 'rot', basePower: 11,
    description: 'Poisons enemies, dealing lingering damage.', emoji: '🖤',
  },
  SpiritFern: {
    type: 'SpiritFern', label: 'Spirit Fern', element: 'spirit', basePower: 14,
    description: 'Summons spectral energy to fight.', emoji: '✨',
  },
  Bramble: {
    type: 'Bramble', label: 'Bramble', element: 'thorn', basePower: 18,
    description: 'Thorns + Thorns combined. Heavy piercing.', emoji: '🌿',
  },
  Rotbriar: {
    type: 'Rotbriar', label: 'Rotbriar', element: 'rot', basePower: 22,
    description: 'Bramble + Rot. Bleeds enemies.', emoji: '🥀',
  },
  Dreamcap: {
    type: 'Dreamcap', label: 'Dreamcap', element: 'moon', basePower: 20,
    description: 'Moonleaf + Glowcap. Dream spores.', emoji: '💫',
  },
  GroveSpirit: {
    type: 'GroveSpirit', label: 'Grove Spirit', element: 'spirit', basePower: 28,
    description: 'A powerful grove entity.', emoji: '🌟',
  },
  RadiantFlower: {
    type: 'RadiantFlower', label: 'Radiant Flower', element: 'sun', basePower: 24,
    description: 'Bloom + Sun. Radiates holy light.', emoji: '🌺',
  },
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
