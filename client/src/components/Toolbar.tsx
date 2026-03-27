import { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CONTAINERS, PLANTS, ELEMENT_COLORS } from '../game/data';
import type { ContainerDef } from '../game/data';
import type { Player } from '../module_bindings/types';

interface Props {
  player: Player | null;
  onStartCombat: () => void;
  onResetRun: () => void;
  isDisabled: boolean;
}

export function Toolbar({ player, onStartCombat, onResetRun, isDisabled }: Props) {
  const [tab, setTab] = useState<'containers' | 'plants'>('containers');
  const isDefeated = !!(player && player.hp <= 0);
  const currency = player?.currency ?? 0;

  return (
    <div style={{
      width: 200,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      fontFamily: 'Crimson Text, serif',
    }}>
      {/* Stats */}
      {player && (
        <div style={{
          background: '#0a180a',
          border: '1px solid #2d4a2d',
          borderRadius: 10,
          padding: '10px 12px',
        }}>
          <div style={{ fontFamily: 'Cinzel', color: '#86efac', fontSize: 12, marginBottom: 6, letterSpacing: 1 }}>
            Grove Vitality
          </div>
          <HpBar current={player.hp} max={player.maxHp} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12 }}>
            <span style={{ color: '#4a6a4a' }}>Round {player.round}</span>
            <span style={{ color: '#fbbf24' }}>💛 {currency}</span>
          </div>
        </div>
      )}

      {/* Action button */}
      {!isDisabled && !isDefeated && (
        <button onClick={onStartCombat} style={actionBtnStyle('#4ade80', '#1a4a2a', '#2d6b3a')}>
          ⚔️ Begin Encounter
        </button>
      )}
      {isDefeated && (
        <button onClick={onResetRun} style={actionBtnStyle('#f87171', '#4a1a1a', '#6b2d2d')}>
          🌱 New Run
        </button>
      )}

      {/* Catalog */}
      {!isDisabled && (
        <div style={{
          background: '#0a180a',
          border: '1px solid #2d4a2d',
          borderRadius: 10,
          overflow: 'hidden',
          flex: 1,
          display: 'flex', flexDirection: 'column',
          minHeight: 0,
        }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid #2d4a2d', flexShrink: 0 }}>
            {(['containers', 'plants'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{
                flex: 1, padding: '7px 4px',
                background: tab === t ? '#152a15' : 'transparent',
                border: 'none', color: tab === t ? '#86efac' : '#3a5a3a',
                fontFamily: 'Cinzel', fontSize: 10, cursor: 'pointer',
                letterSpacing: 0.5,
              }}>
                {t === 'containers' ? '🪴 Pots' : '🌿 Plants'}
              </button>
            ))}
          </div>

          <div style={{ overflowY: 'auto', padding: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
            {tab === 'containers' && Object.values(CONTAINERS).map(def => (
              <DraggableContainer key={def.type} def={def} currency={currency} />
            ))}
            {tab === 'plants' && Object.values(PLANTS).map(def => (
              <DraggablePlant
                key={def.type}
                plantType={def.type}
                emoji={def.emoji}
                label={def.label}
                element={def.element}
                basePower={def.basePower}
                cooldownMs={def.cooldownMs}
                triggerType={def.triggerType}
                rarity={def.rarity}
                cost={15}
                currency={currency}
              />
            ))}
          </div>
        </div>
      )}

      {!isDisabled && (
        <p style={{ color: '#2a4a2a', fontSize: 9, fontFamily: 'Cinzel', textAlign: 'center', margin: 0, letterSpacing: 0.5 }}>
          Drag items onto the board
        </p>
      )}
    </div>
  );
}

// ─── Draggable Catalog Items ──────────────────────────────────────────────────

function DraggableContainer({ def, currency }: { def: ContainerDef; currency: number }) {
  const canAfford = currency >= def.cost;
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `toolbar-container:${def.type}`,
    disabled: !canAfford,
    data: { kind: 'toolbar-container', containerType: def.type, def },
  });

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{
      background: isDragging ? '#152a15' : canAfford ? '#0f1f0f' : '#0a130a',
      border: `1px solid ${isDragging ? '#4ade80' : canAfford ? '#1e3e1e' : '#141f14'}`,
      borderRadius: 6, padding: '5px 7px',
      cursor: canAfford ? 'grab' : 'not-allowed',
      color: canAfford ? '#a0c8a0' : '#3a5a3a',
      opacity: isDragging ? 0.4 : 1,
      userSelect: 'none', touchAction: 'none',
      transition: 'all 0.12s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontFamily: 'Cinzel' }}>{def.emoji} {def.label}</span>
        <span style={{ fontSize: 10, color: canAfford ? '#fbbf24' : '#4a3a1a' }}>{def.cost}💛</span>
      </div>
      <div style={{ fontSize: 9, color: '#3a5a3a', marginTop: 2 }}>
        {def.width}×{def.height} · {def.capacity} slots · {def.soil}
      </div>
    </div>
  );
}

const RARITY_COLORS: Record<string, string> = {
  common: '#4a6a4a', uncommon: '#4ade80', rare: '#60a5fa', epic: '#a855f7', legendary: '#f59e0b',
};

function DraggablePlant({ plantType, emoji, label, element, basePower, cooldownMs, triggerType, rarity, cost, currency }: {
  plantType: string; emoji: string; label: string; element: string;
  basePower: number; cooldownMs: number; triggerType: string; rarity: string;
  cost: number; currency: number;
}) {
  const canAfford = currency >= cost;
  const color = ELEMENT_COLORS[element] ?? '#4ade80';
  const rarityColor = RARITY_COLORS[rarity] ?? '#4a6a4a';

  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `toolbar-plant:${plantType}`,
    disabled: !canAfford,
    data: { kind: 'toolbar-plant', plantType },
  });

  const triggerLabel = triggerType === 'periodic'
    ? `${(cooldownMs / 1000).toFixed(1)}s`
    : triggerType === 'on_enemy_attack' ? 'reactive'
    : triggerType === 'passive' ? 'passive'
    : 'start';

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} style={{
      background: isDragging ? `${color}18` : canAfford ? '#0f1f0f' : '#0a130a',
      border: `1px solid ${isDragging ? color + '66' : rarity !== 'common' ? rarityColor + '44' : canAfford ? '#1e3e1e' : '#141f14'}`,
      borderRadius: 6, padding: '5px 7px',
      cursor: canAfford ? 'grab' : 'not-allowed',
      color: canAfford ? '#a0c8a0' : '#3a5a3a',
      opacity: isDragging ? 0.4 : 1,
      userSelect: 'none', touchAction: 'none',
      transition: 'all 0.12s',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontFamily: 'Cinzel' }}>{emoji} {label}</span>
        <span style={{ fontSize: 10, color: canAfford ? '#fbbf24' : '#4a3a1a' }}>{cost}💛</span>
      </div>
      <div style={{ fontSize: 9, marginTop: 2, display: 'flex', gap: 5 }}>
        <span style={{ color }}>{element}</span>
        <span style={{ color: '#3a5a3a' }}>·</span>
        <span style={{ color: '#3a5a3a' }}>{triggerLabel}</span>
        {basePower > 0 && <><span style={{ color: '#3a5a3a' }}>·</span><span style={{ color: '#3a5a3a' }}>{basePower}pw</span></>}
      </div>
    </div>
  );
}

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(1, current / max));
  const color = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#fbbf24' : '#ef4444';
  return (
    <div style={{ position: 'relative', height: 13, background: '#0f1f0f', borderRadius: 7, border: '1px solid #1a2a1a' }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${pct * 100}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        borderRadius: 7, transition: 'width 0.3s, background 0.3s',
        boxShadow: `0 0 6px ${color}55`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: '#fff', fontFamily: 'Cinzel',
      }}>
        {current}/{max}
      </div>
    </div>
  );
}

function actionBtnStyle(color: string, bg1: string, bg2: string): React.CSSProperties {
  return {
    background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
    border: `1px solid ${color}`,
    borderRadius: 8,
    color,
    fontFamily: 'Cinzel',
    fontSize: 12,
    padding: '9px 12px',
    cursor: 'pointer',
    letterSpacing: 1,
    boxShadow: `0 0 10px ${color}33`,
  };
}
