import { useState, useRef } from 'react';
import {
  DndContext, DragOverlay,
  PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useGrovekeeper } from './hooks/useGrovekeeper';
import { useIsMobile } from './hooks/useIsMobile';
import { GardenBoard } from './components/GardenBoard';
import type { DragData } from './components/GardenBoard';
import { StorageShelf } from './components/StorageShelf';
import type { StashHandle } from './components/StorageShelf';
import { CombatView } from './components/CombatView';
import { ShopView } from './components/ShopView';
import { PLANTS, CONTAINERS, ELEMENT_COLORS } from './game/data';
import type { ActiveEffect } from './module_bindings/types';
import './styles/global.css';

const EFFECT_META: Record<string, { label: string; emoji: string; color: string }> = {
  spore_rot:     { label: 'Spore Rot',   emoji: '🍄', color: '#a855f7' },
  regrowth:      { label: 'Regrowth',    emoji: '🌿', color: '#4ade80' },
  bark_shield:   { label: 'Bark Shield', emoji: '🪵', color: '#a16207' },
  bloom:         { label: 'Bloom',       emoji: '🌸', color: '#f472b6' },
  verdant_surge: { label: 'V. Surge',    emoji: '💨', color: '#86efac' },
  thorns:        { label: 'Thorns',      emoji: '🌵', color: '#86efac' },
  wither:        { label: 'Wither',      emoji: '💀', color: '#6b7280' },
  root_chill:    { label: 'Root Chill',  emoji: '❄️', color: '#93c5fd' },
  entangle:      { label: 'Entangle',    emoji: '🕸️', color: '#fbbf24' },
};

export default function App() {
  const {
    connected, error, player, containers, plants,
    combat, combatLog, shopOffers, inventory, activeEffects,
    moveContainer, removeContainer, rotateContainer, removePlant,
    placeFromInventory, placePlantFromInventory, movePlant,
    startCombat, returnToGrove, rerollShop, buyItem, resetRun,
  } = useGrovekeeper();

  const [activeDrag, setActiveDrag] = useState<DragData | null>(null);
  const [liftedPlantId, setLiftedPlantId] = useState<bigint | null>(null);
  const stashRef = useRef<StashHandle>(null);

  const isMobile = useIsMobile();

  const phase = player?.phase ?? 'build';
  const isBuild = phase === 'build';
  const isCombat = phase === 'combat';
  const combatOver = isCombat && combat != null && combat.status !== 'active';
  const combatVictory = combatOver && combat?.status === 'victory';
  const combatDefeat = combatOver && combat?.status === 'defeat';

  const playerEffects = activeEffects.filter(e => e.target === 'player');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as DragData;
    setActiveDrag(data);
    if (data?.kind === 'placed-plant') setLiftedPlantId(data.plantId);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveDrag(null);
    setLiftedPlantId(null);
    if (!isBuild) return;

    const data = event.active.data.current as DragData | undefined;
    const overId = event.over?.id as string | undefined;
    if (!data) return;

    // ── placed-plant: move to another slot, or stash if dropped anywhere else ──
    if (data.kind === 'placed-plant') {
      if (overId?.startsWith('plantslot:')) {
        const [, xs, ys] = overId.split(':');
        const boardX = parseInt(xs), boardY = parseInt(ys);
        const sameCell = data.fromBoardX === boardX && data.fromBoardY === boardY;
        if (!sameCell) {
          movePlant(data.plantId, boardX, boardY);
          return;
        }
        // Dropped back on own slot — no-op (onClick handles click-to-stash)
        return;
      }
      // Dropped on stash, empty cell, or nowhere — send to stash
      removePlant(data.plantId);
      return;
    }

    // ── placed-container ──────────────────────────────────────────────────────
    if (data.kind === 'placed-container') {
      if (overId?.startsWith('cell:')) {
        const [, xs, ys] = overId.split(':');
        moveContainer(data.containerId, parseInt(xs), parseInt(ys));
      } else {
        removeContainer(data.containerId);
      }
      return;
    }

    // ── inventory items ───────────────────────────────────────────────────────
    if (data.kind === 'inventory-container') {
      if (overId?.startsWith('cell:')) {
        const [, xs, ys] = overId.split(':');
        placeFromInventory(data.inventoryId, parseInt(xs), parseInt(ys));
      } else {
        stashRef.current?.repositionItem(data.inventoryId.toString(), event.delta.x, event.delta.y);
      }
      return;
    }

    if (data.kind === 'inventory-plant') {
      if (overId?.startsWith('plantslot:')) {
        const [, xs, ys] = overId.split(':');
        placePlantFromInventory(data.inventoryId, parseInt(xs), parseInt(ys));
      } else {
        stashRef.current?.repositionItem(data.inventoryId.toString(), event.delta.x, event.delta.y);
      }
      return;
    }
  }

  function handleDragCancel() {
    setActiveDrag(null);
    setLiftedPlantId(null);
  }

  return (
    <div style={{
      height: '100vh',
      background: 'radial-gradient(ellipse at 50% 0%, #0d2010 0%, #050d05 100%)',
      display: 'flex', flexDirection: 'column',
      fontFamily: 'Crimson Text, serif',
      color: '#86a086',
      overflow: 'hidden',
    }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header style={{
        display: 'flex', alignItems: 'center',
        gap: isMobile ? 8 : 16,
        padding: isMobile ? '6px 10px' : '8px 20px',
        background: '#070f07',
        borderBottom: '1px solid #1a2e1a',
        boxShadow: '0 2px 12px #00000088',
        flexShrink: 0,
        minWidth: 0,
        flexWrap: isMobile ? 'wrap' : 'nowrap',
      }}>
        {/* Logo */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ fontFamily: 'Cinzel', color: '#4ade80', fontSize: isMobile ? 12 : 16, letterSpacing: isMobile ? 1 : 3 }}>
            🌿 {isMobile ? 'GK' : 'GROVEKEEPER'}
          </div>
        </div>

        {player && (
          <>
            {!isMobile && <div style={{ width: 1, height: 32, background: '#1a2e1a', flexShrink: 0 }} />}

            {/* HP bar */}
            <div style={{ flexShrink: 0, width: isMobile ? 100 : 140 }}>
              {!isMobile && (
                <div style={{ fontSize: 9, color: '#4a6a4a', fontFamily: 'Cinzel', letterSpacing: 1, marginBottom: 3 }}>
                  GROVE HP
                </div>
              )}
              <HpBar current={player.hp} max={player.maxHp} />
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: isMobile ? 8 : 14, flexShrink: 0, fontSize: isMobile ? 11 : 12 }}>
              <span style={{ color: '#4a6a4a' }}>R<span style={{ color: '#86efac' }}>{player.round}</span></span>
              <span style={{ color: '#fbbf24', fontFamily: 'Cinzel' }}>💛 {player.currency}</span>
            </div>

            {/* Active player effects — hide on mobile (shown in combat view) */}
            {!isMobile && playerEffects.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                {playerEffects.map(e => (
                  <EffectBadge key={e.effect} effect={e} />
                ))}
              </div>
            )}
          </>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Phase + Action */}
        {player && (
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 10, flexShrink: 0 }}>
            {isBuild && (
              <button
                onClick={startCombat}
                style={{
                  background: 'linear-gradient(135deg, #1a4a2a, #2d6b3a)',
                  border: '1px solid #4ade80',
                  borderRadius: 8, color: '#4ade80',
                  fontFamily: 'Cinzel', fontSize: isMobile ? 10 : 12,
                  padding: isMobile ? '5px 10px' : '7px 16px', cursor: 'pointer',
                  letterSpacing: 1, boxShadow: '0 0 10px #4ade8033',
                  whiteSpace: 'nowrap',
                }}
              >
                ⚔️ {isMobile ? 'Fight' : 'Begin Encounter'}
              </button>
            )}
            {combatVictory && (
              <button
                onClick={returnToGrove}
                style={{
                  background: 'linear-gradient(135deg, #1a4a2a, #2d6b3a)',
                  border: '1px solid #4ade80',
                  borderRadius: 8, color: '#4ade80',
                  fontFamily: 'Cinzel', fontSize: isMobile ? 10 : 12,
                  padding: isMobile ? '5px 10px' : '7px 16px', cursor: 'pointer',
                  letterSpacing: 1, boxShadow: '0 0 10px #4ade8033',
                  whiteSpace: 'nowrap',
                  animation: 'pulse 1.5s infinite',
                }}
              >
                🌿 {isMobile ? 'Grove' : 'Return to Grove'}
              </button>
            )}
            {combatDefeat && (
              <button
                onClick={resetRun}
                style={{
                  background: 'linear-gradient(135deg, #4a1a1a, #6b2d2d)',
                  border: '1px solid #f87171',
                  borderRadius: 8, color: '#f87171',
                  fontFamily: 'Cinzel', fontSize: isMobile ? 10 : 12,
                  padding: isMobile ? '5px 10px' : '7px 16px', cursor: 'pointer',
                  letterSpacing: 1,
                }}
              >
                🌱 {isMobile ? 'Retry' : 'New Run'}
              </button>
            )}
            <div style={{
              background: isBuild ? '#0f2a0f' : '#2a1a0a',
              border: `1px solid ${isBuild ? '#2d4a2d' : '#6b3a0a'}`,
              borderRadius: 20, padding: isMobile ? '3px 8px' : '4px 12px',
              fontFamily: 'Cinzel', fontSize: isMobile ? 9 : 11,
              color: isBuild ? '#4ade80' : '#f97316',
              letterSpacing: 1,
            }}>
              {isBuild ? '🌱 BUILD' : '⚔️ COMBAT'}
            </div>
          </div>
        )}

        {/* Connection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', display: 'inline-block',
            background: connected ? '#4ade80' : '#ef4444',
            boxShadow: connected ? '0 0 5px #4ade80' : undefined,
          }} />
        </div>
      </header>

      {error && (
        <div style={{
          background: '#2a0a0a', borderBottom: '1px solid #6b1a1a',
          padding: '6px 20px', color: '#f87171', fontSize: 12, flexShrink: 0,
        }}>
          ⚠️ {error}
        </div>
      )}

      {!connected && !error && (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 12, color: '#2d4a2d',
        }}>
          <div style={{ fontSize: 40 }}>🌿</div>
          <div style={{ fontFamily: 'Cinzel', letterSpacing: 2 }}>Awakening the Grove...</div>
        </div>
      )}

      {connected && (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <div style={{
            flex: 1, display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            minHeight: 0,
            overflow: isMobile ? 'auto' : 'hidden',
            WebkitOverflowScrolling: 'touch',
          }}>

            {/* Center: Board (scrollable) + Stash (always visible) */}
            <main style={{
              flex: isMobile ? 'none' : 1,
              display: 'flex', flexDirection: 'column',
              minHeight: 0, minWidth: 0,
            }}>
              <div style={{
                flex: isMobile ? 'none' : 1,
                overflowX: isMobile ? 'auto' : 'hidden',
                overflowY: isMobile ? 'hidden' : 'auto',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: isMobile ? '10px 8px 6px' : '16px 16px 8px',
              }}>
                <GardenBoard
                  containers={containers}
                  plants={plants}
                  onRemoveContainer={removeContainer}
                  onRemovePlant={removePlant}
                  onRotateContainer={rotateContainer}
                  isDisabled={!isBuild}
                  liftedPlantId={liftedPlantId}
                  isCombatActive={isCombat}
                  isMobile={isMobile}
                />
              </div>
              <div style={{ flexShrink: 0, width: '100%' }}>
                <StorageShelf ref={stashRef} inventory={inventory} isDisabled={!isBuild} isMobile={isMobile} />
              </div>
            </main>

            {/* Right (desktop) / Below (mobile): Shop or Combat */}
            <aside style={{
              width: isMobile ? '100%' : 360,
              flexShrink: 0,
              padding: isMobile ? '10px 10px 20px' : '14px 16px',
              borderLeft: isMobile ? 'none' : '1px solid #1a2e1a',
              borderTop: isMobile ? '1px solid #1a2e1a' : 'none',
              overflowY: isMobile ? 'visible' : 'auto',
              background: '#060e06',
            }}>
              {isCombat && combat && (
                <CombatView combat={combat} log={combatLog} activeEffects={activeEffects} />
              )}
              {isBuild && (
                <ShopView offers={shopOffers} player={player} onBuy={buyItem} onReroll={rerollShop} />
              )}
            </aside>
          </div>

          <DragOverlay dropAnimation={null}>
            {activeDrag && <DragGhost data={activeDrag} />}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}

// ─── Effect Badge ─────────────────────────────────────────────────────────────

function EffectBadge({ effect }: { effect: ActiveEffect }) {
  const meta = EFFECT_META[effect.effect] ?? { label: effect.effect, emoji: '?', color: '#888' };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3,
      padding: '2px 6px',
      background: `${meta.color}18`,
      border: `1px solid ${meta.color}55`,
      borderRadius: 10, fontSize: 11, color: meta.color,
      whiteSpace: 'nowrap',
    }}>
      <span>{meta.emoji}</span>
      <span style={{ fontWeight: 700 }}>×{effect.stacks}</span>
    </div>
  );
}

// ─── HP Bar ───────────────────────────────────────────────────────────────────

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(1, current / max));
  const color = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#fbbf24' : '#ef4444';
  return (
    <div style={{ position: 'relative', height: 12, background: '#0f1f0f', borderRadius: 6, border: '1px solid #1a2a1a' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${pct * 100}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        borderRadius: 6, transition: 'width 0.3s, background 0.3s',
        boxShadow: `0 0 6px ${color}55`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 8, color: '#fff', fontFamily: 'Cinzel',
      }}>
        {current}/{max}
      </div>
    </div>
  );
}

// ─── Drag Ghost ───────────────────────────────────────────────────────────────

const GHOST_CELL = 58; // px per grid cell in the drag ghost

function DragGhost({ data }: { data: DragData }) {
  if (data.kind === 'inventory-container' || data.kind === 'placed-container') {
    const def = data.def;
    if (def.image) {
      return (
        <img
          src={def.image}
          draggable={false}
          style={{
            width: def.width * GHOST_CELL,
            height: def.height * GHOST_CELL,
            objectFit: 'fill',
            opacity: 0.6,
            pointerEvents: 'none',
            display: 'block',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
          }}
        />
      );
    }
    return (
      <div style={{
        borderRadius: 8, padding: '8px 12px', opacity: 0.85,
        background: '#152a15', border: '2px solid #4ade80',
        color: '#86efac', fontFamily: 'Cinzel',
        pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 13 }}>{def.emoji} {def.label}</div>
        <div style={{ fontSize: 10, color: '#4ade80' }}>{def.width}×{def.height}</div>
      </div>
    );
  }

  if (data.kind === 'inventory-plant' || data.kind === 'placed-plant') {
    const def = PLANTS[data.plantType];
    const w = def?.width ?? 1;
    const h = def?.height ?? 1;
    if (def?.image) {
      return (
        <img
          src={def.image}
          draggable={false}
          style={{
            width: w * GHOST_CELL,
            height: h * GHOST_CELL,
            objectFit: 'contain',
            opacity: 0.6,
            pointerEvents: 'none',
            display: 'block',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.6))',
          }}
        />
      );
    }
    const color = ELEMENT_COLORS[def?.element ?? 'verdant'] ?? '#4ade80';
    return (
      <div style={{
        borderRadius: 8, padding: '8px 12px', opacity: 0.85,
        background: `${color}22`, border: `2px solid ${color}88`,
        color: '#c4e8c4', fontFamily: 'Cinzel',
        pointerEvents: 'none',
      }}>
        <div style={{ fontSize: 13 }}>{def?.emoji ?? '🌱'} {def?.label ?? data.plantType}</div>
        <div style={{ fontSize: 10, color }}>◆ {def?.element}</div>
      </div>
    );
  }

  return null;
}

// ─── Lore Panel ───────────────────────────────────────────────────────────────

function LorePanel() {
  return (
    <div style={{ color: '#4a6a4a', lineHeight: 1.7 }}>
      <div style={{ fontFamily: 'Cinzel', color: '#2d4a2d', fontSize: 13, marginBottom: 12, letterSpacing: 1 }}>
        🌙 Grove Lore
      </div>
      <p style={{ fontSize: 12, marginBottom: 10 }}>
        You are a Grovekeeper — caretaker of a living sacred garden whose plants awaken to fight.
      </p>
      <p style={{ fontSize: 12, marginBottom: 14 }}>
        Buy items from the shop after each round. Drag them from your stash onto the board. Send your grove into battle.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {[
          ['🌿', 'Matching soil to plant element gives +2 power'],
          ['⚔️', 'Fill a container to unlock bonus effects'],
          ['✨', 'Spirit plants thrive in Rune Circles'],
          ['🍄', 'Fungus plants deal 50% more in Stone Basin'],
          ['↔️', 'Drag placed plants between slots to rearrange'],
        ].map(([icon, tip]) => (
          <div key={tip} style={{ display: 'flex', gap: 8, fontSize: 11 }}>
            <span>{icon}</span><span>{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
