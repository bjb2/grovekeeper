import { useRef, useEffect, useState } from 'react';
import type { EnemyContainerOnBoard, EnemyPlantInCombat, CombatState } from '../module_bindings/types';
import { CONTAINERS, PLANTS, ELEMENT_COLORS } from '../game/data';
import { Tooltip } from './Tooltip';
import { PlantTooltipContent } from './ShopView';

const GRID_SIZE = 6;
const CELL_SIZE = 68;
const GAP = 2;
const PADDING = 8;
const cellPx = (coord: number) => PADDING + coord * (CELL_SIZE + GAP);

// ─── Floating combat numbers ──────────────────────────────────────────────────

interface FloatNum {
  id: number;
  text: string;
  color: string;
  x: number;
}

let _floatId = 0;

function effectDisplay(effect: string, value: number): { text: string; color: string } | null {
  if (!effect || effect === 'none') return null;
  switch (effect) {
    case 'damage':        return { text: `−${value}`,      color: '#f87171' };
    case 'spirit_damage': return { text: `−${value}✦`,     color: '#c4b5fd' };
    case 'heal':          return { text: `+${value}`,       color: '#4ade80' };
    case 'spore_rot':     return { text: `🍄×${value}`,    color: '#a855f7' };
    case 'regrowth':      return { text: `🌿+${value}`,    color: '#4ade80' };
    case 'bark_shield':   return { text: `🪵+${value}`,    color: '#d97706' };
    case 'bloom':         return { text: `🌸+${value}`,    color: '#f472b6' };
    case 'verdant_surge': return { text: `💨+${value}`,    color: '#86efac' };
    case 'thorns':        return { text: `🌵+${value}`,    color: '#86efac' };
    case 'wither':        return { text: `💀×${value}`,    color: '#9ca3af' };
    case 'root_chill':    return { text: `❄️×${value}`,    color: '#93c5fd' };
    case 'entangle':      return { text: `🕸️×${value}`,   color: '#fbbf24' };
    default:              return { text: `+${value}`,       color: '#c4e8c4' };
  }
}

// Crimson soil tones for enemy containers
const ENEMY_SOIL_COLORS: Record<string, string> = {
  normal: '#3d1a1a',
  fertile: '#4a1a1a',
  dry: '#3a1a12',
  rot: '#2a1a2a',
  lunar: '#1a1a3a',
  spirit: '#1a2a2a',
};

interface Props {
  containers: EnemyContainerOnBoard[];
  plants: EnemyPlantInCombat[];
  combat: CombatState | null;
}

export function EnemyBoard({ containers, plants, combat }: Props) {
  const isCombatActive = combat?.status === 'active';

  const containerAtCell = (x: number, y: number) =>
    containers.find(c => x >= c.x && x < c.x + c.width && y >= c.y && y < c.y + c.height);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gap: GAP,
          background: '#1a0d0d',
          padding: PADDING,
          borderRadius: 12,
          border: '1px solid #4a1a1a',
          boxShadow: '0 0 40px #1a0505, inset 0 0 30px #150505',
          position: 'relative',
          zIndex: 0,
        }}
      >
        {Array.from({ length: GRID_SIZE }, (_, y) =>
          Array.from({ length: GRID_SIZE }, (_, x) => {
            const c = containerAtCell(x, y);
            const isOrigin = c?.x === x && c?.y === y;
            const isInContainer = !!c;

            if (isInContainer && !isOrigin) {
              return <div key={`${x}:${y}`} style={{ display: 'none' }} />;
            }

            if (isOrigin && c) {
              const cDef = CONTAINERS[c.containerType];
              return (
                <div
                  key={`${x}:${y}`}
                  style={{
                    width: c.width * CELL_SIZE + (c.width - 1) * GAP,
                    height: c.height * CELL_SIZE + (c.height - 1) * GAP,
                    gridColumn: `${x + 1} / span ${c.width}`,
                    gridRow: `${y + 1} / span ${c.height}`,
                    background: cDef?.image ? 'transparent' : (ENEMY_SOIL_COLORS[c.soilType] ?? '#3d1a1a'),
                    border: cDef?.image ? 'none' : '1px solid #6a2a2a',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px #00000080, inset 0 0 8px #2a050580',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                  }}
                >
                  {cDef?.image && (
                    <img
                      src={cDef.image}
                      style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', opacity: 0.85 }}
                      draggable={false}
                    />
                  )}
                </div>
              );
            }

            // Empty cell
            return (
              <div
                key={`${x}:${y}`}
                style={{
                  width: CELL_SIZE,
                  height: CELL_SIZE,
                  background: '#1f0d0d',
                  border: '1px solid #2d1a1a',
                  borderRadius: 4,
                }}
              />
            );
          })
        )}
      </div>

      {/* Plant overlays */}
      {plants.map(p => (
        <EnemyPlantOverlay
          key={p.id.toString()}
          plant={p}
          isCombatActive={isCombatActive}
        />
      ))}

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 60%, #0f0505 100%)',
        borderRadius: 12,
        zIndex: 20,
      }} />
    </div>
  );
}

function EnemyPlantOverlay({ plant, isCombatActive }: {
  plant: EnemyPlantInCombat;
  isCombatActive: boolean;
}) {
  const popRef = useRef<HTMLDivElement>(null);
  const prevTriggerCount = useRef(plant.triggerCount);
  const [floats, setFloats] = useState<FloatNum[]>([]);

  useEffect(() => {
    if (!isCombatActive) return;
    if (plant.triggerCount !== prevTriggerCount.current) {
      prevTriggerCount.current = plant.triggerCount;
      const el = popRef.current;
      if (el) {
        el.style.animation = 'none';
        void el.offsetHeight;
        el.style.animation = 'plant-pop 380ms cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards';
      }

      const nums: FloatNum[] = [];
      const primary = effectDisplay(plant.primaryEffect, plant.primaryValue);
      if (primary) nums.push({ id: ++_floatId, ...primary, x: 0 });
      const secondary = effectDisplay(plant.secondaryEffect, plant.secondaryValue);
      if (secondary) nums.push({ id: ++_floatId, ...secondary, x: nums.length ? 18 : 0 });

      if (nums.length > 0) {
        setFloats(prev => [...prev, ...nums]);
        const ids = nums.map(n => n.id);
        setTimeout(() => setFloats(prev => prev.filter(n => !ids.includes(n.id))), 1100);
      }
    }
  }, [plant.triggerCount, isCombatActive]);

  const W = plant.plantWidth ?? 1;
  const H = plant.plantHeight ?? 1;
  const left = cellPx(plant.boardX);
  const top = cellPx(plant.boardY);
  const width = W * CELL_SIZE + (W - 1) * GAP;
  const height = H * CELL_SIZE + (H - 1) * GAP;

  const color = ELEMENT_COLORS[plant.element] ?? '#f87171';
  const plantDef = PLANTS[plant.plantType];
  const hasImage = !!plantDef?.image;

  const overlayDiv = (
    <div
      ref={popRef}
      style={{
        position: 'absolute',
        left, top, width, height,
        zIndex: 5,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: '100%', height: '100%',
          borderRadius: 4,
          background: hasImage ? 'transparent' : `${color}22`,
          border: hasImage ? 'none' : `1px solid ${color}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {hasImage
          ? <img src={plantDef!.image} style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none', display: 'block' }} draggable={false} />
          : <span style={{ fontSize: W > 1 || H > 1 ? 18 : 14, pointerEvents: 'none' }}>{getPlantEmoji(plant.plantType)}</span>
        }

        {isCombatActive && plant.triggerType === 'periodic' && plant.cooldownMs > 0n && (
          <div
            key={plant.triggerCount}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(25, 0, 5, 0.52)',
              animation: `cooldown-overlay ${Number(plant.cooldownMs)}ms linear forwards`,
              pointerEvents: 'none',
              ...(plantDef?.image ? {
                WebkitMaskImage: `url(${plantDef.image})`,
                WebkitMaskSize: '100% 100%',
                WebkitMaskRepeat: 'no-repeat',
                maskImage: `url(${plantDef.image})`,
                maskSize: '100% 100%',
                maskRepeat: 'no-repeat',
              } : { borderRadius: 4 }),
            }}
          />
        )}
      </div>

      {/* Floating combat numbers */}
      {floats.map(f => (
        <div
          key={f.id}
          style={{
            position: 'absolute',
            left: '50%',
            top: 0,
            transform: `translateX(calc(-50% + ${f.x}px))`,
            pointerEvents: 'none',
            zIndex: 30,
            fontFamily: 'Cinzel, serif',
            fontWeight: 700,
            fontSize: 14,
            color: f.color,
            textShadow: `0 0 6px ${f.color}cc, 0 1px 2px #000c`,
            whiteSpace: 'nowrap',
            animation: 'float-number 1.05s ease-out forwards',
          }}
        >
          {f.text}
        </div>
      ))}
    </div>
  );

  if (plantDef) {
    return <Tooltip content={<PlantTooltipContent def={plantDef} />}>{overlayDiv}</Tooltip>;
  }
  return overlayDiv;
}

function getPlantEmoji(type: string): string {
  const map: Record<string, string> = {
    Moonleaf: '🌿', Thornvine: '🌵', Glowcap: '🍄', Sunblossom: '🌻',
    Rotroot: '🖤', SpiritFern: '✨', Bramble: '🌿', Rotbriar: '🥀',
    Dreamcap: '💫', GroveSpirit: '🌟', RadiantFlower: '🌺',
    VerdantMoss: '🌱', Duskbloom: '🌑', BriarWraith: '👹',
    LunarDryad: '🌙', RotMass: '🫧', SunGuardian: '☀️',
    Foxglove: '🌺', BrambleSeed: '🌿', SporePuff: '🍄', WiltingGrass: '🥀',
    SunSprout: '🌻', IceFrond: '🌾', NettleVine: '🌵', MireMoss: '🟤',
    GreymossTree: '🌲', CrimsonPetal: '🌸', ChillFern: '🪴', SporeHusk: '💀',
    ReactiveVine: '⚡', ToxicThorn: '☠️', VenomCore: '🐍', SunForge: '🔥',
    FrostRoot: '❄️', BarkcladShield: '🛡️', ThornsWraith: '👻', PlagueRoot: '🫀',
  };
  return map[type] ?? '🌱';
}
