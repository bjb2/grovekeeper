import { useState } from 'react';
import type { SelectedTool } from './GardenBoard';
import { CONTAINERS, PLANTS, ELEMENT_COLORS } from '../game/data';
import type { Player } from '../module_bindings';

interface Props {
  player: Player | null;
  selectedTool: SelectedTool | null;
  onSelectTool: (tool: SelectedTool | null) => void;
  onStartCombat: () => void;
  onResetRun: () => void;
  disabled: boolean;
}

export function Toolbar({ player, selectedTool, onSelectTool, onStartCombat, onResetRun, disabled }: Props) {
  const [activeTab, setActiveTab] = useState<'containers' | 'plants'>('containers');

  const isDefeated = player && player.hp <= 0;

  return (
    <div style={{
      width: 220,
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
      fontFamily: 'Crimson Text, serif',
    }}>
      {/* Player stats */}
      {player && (
        <div style={{
          background: '#0f1f0f',
          border: '1px solid #2d4a2d',
          borderRadius: 10,
          padding: 12,
        }}>
          <div style={{ fontFamily: 'Cinzel', color: '#86efac', fontSize: 13, marginBottom: 8 }}>
            Grove Vitality
          </div>
          <HpBar current={player.hp} max={player.maxHp} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ color: '#86a086', fontSize: 13 }}>Round {player.round}</span>
            <span style={{ color: '#fbbf24', fontSize: 13 }}>
              💛 {player.currency} Sap
            </span>
          </div>
        </div>
      )}

      {/* Actions */}
      {!disabled && !isDefeated && (
        <button
          onClick={onStartCombat}
          style={{
            background: 'linear-gradient(135deg, #1a4a2a, #2d6b3a)',
            border: '1px solid #4ade80',
            borderRadius: 8,
            color: '#4ade80',
            fontFamily: 'Cinzel',
            fontSize: 13,
            padding: '10px 14px',
            cursor: 'pointer',
            letterSpacing: 1,
            boxShadow: '0 0 12px #4ade8044',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 0 20px #4ade8088')}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 0 12px #4ade8044')}
        >
          ⚔️ Begin Encounter
        </button>
      )}
      {isDefeated && (
        <button
          onClick={onResetRun}
          style={{
            background: 'linear-gradient(135deg, #4a1a1a, #6b2d2d)',
            border: '1px solid #f87171',
            borderRadius: 8,
            color: '#f87171',
            fontFamily: 'Cinzel',
            fontSize: 13,
            padding: '10px 14px',
            cursor: 'pointer',
            letterSpacing: 1,
          }}
        >
          🌱 New Run
        </button>
      )}

      {/* Tool tabs */}
      {!disabled && (
        <div style={{
          background: '#0f1f0f',
          border: '1px solid #2d4a2d',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', borderBottom: '1px solid #2d4a2d' }}>
            {(['containers', 'plants'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); onSelectTool(null); }}
                style={{
                  flex: 1, padding: '8px 4px',
                  background: activeTab === tab ? '#1a3a1a' : 'transparent',
                  border: 'none',
                  color: activeTab === tab ? '#86efac' : '#4a6a4a',
                  fontFamily: 'Cinzel',
                  fontSize: 11,
                  cursor: 'pointer',
                  letterSpacing: 0.5,
                }}
              >
                {tab === 'containers' ? '🪴 Containers' : '🌿 Plants'}
              </button>
            ))}
          </div>

          <div style={{ maxHeight: 420, overflowY: 'auto', padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {activeTab === 'containers' && Object.values(CONTAINERS).map(def => {
              const canAfford = (player?.currency ?? 0) >= def.cost;
              const isSelected = selectedTool?.kind === 'container' && selectedTool.def.type === def.type;
              return (
                <button
                  key={def.type}
                  onClick={() => onSelectTool(isSelected ? null : { kind: 'container', def })}
                  disabled={!canAfford}
                  style={{
                    background: isSelected ? '#1a3a2a' : canAfford ? '#111e11' : '#0a150a',
                    border: `1px solid ${isSelected ? '#4ade80' : canAfford ? '#2a4a2a' : '#1a2a1a'}`,
                    borderRadius: 6,
                    padding: '6px 8px',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    color: canAfford ? '#c4e8c4' : '#4a6a4a',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? '0 0 8px #4ade8044' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontFamily: 'Cinzel' }}>{def.emoji} {def.label}</span>
                    <span style={{ fontSize: 11, color: canAfford ? '#fbbf24' : '#5a4a2a' }}>
                      {def.cost}💛
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: '#6a8a6a', marginTop: 2 }}>
                    {def.width}×{def.height} · {def.capacity} plants · {def.soil}
                  </div>
                </button>
              );
            })}

            {activeTab === 'plants' && Object.values(PLANTS).map(def => {
              const cost = 15;
              const canAfford = (player?.currency ?? 0) >= cost;
              const isSelected = selectedTool?.kind === 'plant' && selectedTool.plantType === def.type;
              const color = ELEMENT_COLORS[def.element];
              return (
                <button
                  key={def.type}
                  onClick={() => onSelectTool(isSelected ? null : { kind: 'plant', plantType: def.type })}
                  disabled={!canAfford}
                  style={{
                    background: isSelected ? `${color}22` : canAfford ? '#111e11' : '#0a150a',
                    border: `1px solid ${isSelected ? color + '66' : canAfford ? '#2a4a2a' : '#1a2a1a'}`,
                    borderRadius: 6,
                    padding: '6px 8px',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    textAlign: 'left',
                    color: canAfford ? '#c4e8c4' : '#4a6a4a',
                    transition: 'all 0.15s',
                    boxShadow: isSelected ? `0 0 8px ${color}44` : 'none',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontFamily: 'Cinzel' }}>{def.emoji} {def.label}</span>
                    <span style={{ fontSize: 11, color: canAfford ? '#fbbf24' : '#5a4a2a' }}>{cost}💛</span>
                  </div>
                  <div style={{ fontSize: 10, marginTop: 2 }}>
                    <span style={{ color, marginRight: 4 }}>◆ {def.element}</span>
                    <span style={{ color: '#6a8a6a' }}>{def.basePower} power</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedTool && (
        <button
          onClick={() => onSelectTool(null)}
          style={{
            background: 'transparent',
            border: '1px solid #4a6a4a',
            borderRadius: 6,
            color: '#6a8a6a',
            padding: '6px',
            cursor: 'pointer',
            fontSize: 12,
            fontFamily: 'Cinzel',
          }}
        >
          ✕ Cancel
        </button>
      )}
    </div>
  );
}

function HpBar({ current, max }: { current: number; max: number }) {
  const pct = Math.max(0, Math.min(1, current / max));
  const color = pct > 0.5 ? '#4ade80' : pct > 0.25 ? '#fbbf24' : '#ef4444';
  return (
    <div style={{ position: 'relative', height: 14, background: '#1a2a1a', borderRadius: 7 }}>
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${pct * 100}%`,
        background: `linear-gradient(90deg, ${color}88, ${color})`,
        borderRadius: 7,
        transition: 'width 0.3s, background 0.3s',
        boxShadow: `0 0 8px ${color}66`,
      }} />
      <div style={{
        position: 'absolute', inset: 0, display: 'flex',
        alignItems: 'center', justifyContent: 'center',
        fontSize: 10, color: '#fff', fontFamily: 'Cinzel',
      }}>
        {current}/{max}
      </div>
    </div>
  );
}
