import { useEffect, useRef } from 'react';
import type { CombatState, CombatLogEntry, ActiveEffect } from '../module_bindings/types';
import { EFFECT_META } from '../game/data';
import { Tooltip } from './Tooltip';

interface Props {
  combat: CombatState;
  log: CombatLogEntry[];
  activeEffects: ActiveEffect[];
}

export function CombatView({ combat, log, activeEffects }: Props) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const enemyPct = combat.enemyMaxHp > 0
    ? Math.max(0, combat.enemyHp / combat.enemyMaxHp)
    : 0;

  const statusColor =
    combat.status === 'victory' ? '#4ade80' :
    combat.status === 'defeat' ? '#ef4444' :
    '#fbbf24';

  const playerEffects = activeEffects.filter(e => e.target === 'player');
  const enemyEffects  = activeEffects.filter(e => e.target === 'enemy');

  return (
    <div style={{
      background: '#0a0f0a',
      border: '1px solid #2d3a2d',
      borderRadius: 12,
      padding: 20,
      minWidth: 0,
      maxWidth: 420,
      fontFamily: 'Crimson Text, serif',
      display: 'flex',
      flexDirection: 'column',
      gap: 12,
    }}>
      <h2 style={{
        margin: 0, fontFamily: 'Cinzel', color: '#c4e8c4', fontSize: 16,
        letterSpacing: 2, textAlign: 'center',
      }}>
        ⚔️ ENCOUNTER
      </h2>

      {/* Enemy card */}
      <div style={{
        background: '#0f1a0f',
        border: '1px solid #3a2a2a',
        borderRadius: 8,
        padding: 12,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#f87171', fontFamily: 'Cinzel', fontSize: 14 }}>
            {combat.enemyName}
          </span>
          <span style={{ color: '#f87171', fontSize: 13 }}>
            ⚔️ {combat.enemyAttack} / {(Number(combat.enemyCooldownMs) / 1000).toFixed(1)}s
          </span>
        </div>
        <div style={{ height: 10, background: '#1a1a1a', borderRadius: 5, overflow: 'hidden' }}>
          <div style={{
            height: '100%',
            width: `${enemyPct * 100}%`,
            background: 'linear-gradient(90deg, #7f1d1d, #ef4444)',
            borderRadius: 5,
            transition: 'width 0.4s',
            boxShadow: '0 0 8px #ef444488',
          }} />
        </div>
        <div style={{ textAlign: 'right', fontSize: 11, color: '#9a5a5a', marginTop: 4 }}>
          {combat.enemyHp} / {combat.enemyMaxHp} HP
        </div>
        {/* Enemy debuffs */}
        {enemyEffects.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
            {enemyEffects.map(e => <EffectBadge key={e.effect} effect={e} />)}
          </div>
        )}
      </div>

      {/* Spirit Essence */}
      {(combat.status === 'active' || combat.spiritEssence > 0) && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '6px 10px',
          background: '#0a0a1f',
          border: '1px solid #4a3a6a',
          borderRadius: 6,
        }}>
          <span style={{ color: '#e9d5ff', fontSize: 13 }}>✦ Spirit Essence</span>
          <div style={{ flex: 1, display: 'flex', gap: 3 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} style={{
                width: 14, height: 14, borderRadius: '50%',
                background: i < combat.spiritEssence ? '#7c3aed' : '#1e1e3a',
                boxShadow: i < combat.spiritEssence ? '0 0 6px #7c3aed' : 'none',
                transition: 'background 0.3s',
              }} />
            ))}
          </div>
          <span style={{ color: '#7c3aed', fontSize: 12 }}>{combat.spiritEssence}/10</span>
        </div>
      )}

      {/* Grove buffs */}
      {playerEffects.length > 0 && (
        <div style={{
          padding: '6px 10px',
          background: '#0a180a',
          border: '1px solid #1a3a1a',
          borderRadius: 6,
        }}>
          <div style={{ color: '#4a8a4a', fontSize: 11, marginBottom: 5, fontFamily: 'Cinzel' }}>
            GROVE BUFFS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {playerEffects.map(e => <EffectBadge key={e.effect} effect={e} />)}
          </div>
        </div>
      )}

      {/* Fatigue warning */}
      {combat.fatigueActive && (
        <div style={{
          textAlign: 'center', padding: '6px 10px',
          background: '#2a0a0a',
          border: '1px solid #ef4444',
          borderRadius: 6,
          color: '#ef4444',
          fontSize: 13,
          animation: 'pulse 1s infinite',
        }}>
          ⚠ Grove Wildfire — {combat.fatigueDamage} Corruption/2s
        </div>
      )}

      {/* Status banner */}
      {combat.status !== 'active' && (
        <div style={{
          textAlign: 'center', padding: 10,
          background: combat.status === 'victory' ? '#0a2a0a' : '#2a0a0a',
          border: `1px solid ${statusColor}`,
          borderRadius: 8,
          color: statusColor,
          fontFamily: 'Cinzel',
          fontSize: 15,
          letterSpacing: 2,
          boxShadow: `0 0 16px ${statusColor}44`,
        }}>
          {combat.status === 'victory' ? '🌿 VICTORY' : '💀 GROVE FALLEN'}
        </div>
      )}

      {/* Active indicator */}
      {combat.status === 'active' && (
        <div style={{ textAlign: 'center', color: '#4a6a4a', fontSize: 12, fontFamily: 'Cinzel' }}>
          {combat.clockTicks >= 13 ? '🔥' : ''}
          Tick {combat.tick}
          <span style={{ display: 'inline-block', marginLeft: 8, color: '#4ade80' }}>◆</span>
        </div>
      )}

      {/* Combat log */}
      <div
        ref={logRef}
        style={{
          height: 200,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          padding: '4px 0',
          borderTop: '1px solid #1a2a1a',
          scrollBehavior: 'smooth',
        }}
      >
        {log.map(entry => (
          <div
            key={String(entry.id)}
            style={{
              padding: '3px 8px',
              borderRadius: 4,
              fontSize: 13,
              color: entryColor(entry.entryType),
              background: entryBg(entry.entryType),
              borderLeft: `2px solid ${entryColor(entry.entryType)}44`,
              lineHeight: 1.4,
            }}
          >
            {entry.message}
          </div>
        ))}
        {log.length === 0 && (
          <div style={{ color: '#3a5a3a', textAlign: 'center', fontSize: 13, padding: 20 }}>
            Awaiting combat...
          </div>
        )}
      </div>
    </div>
  );
}

function EffectBadge({ effect }: { effect: ActiveEffect }) {
  const meta = EFFECT_META[effect.effect] ?? { label: effect.effect, emoji: '?', color: '#888', description: '' };
  const badge = (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 3,
      padding: '2px 7px',
      background: `${meta.color}18`,
      border: `1px solid ${meta.color}55`,
      borderRadius: 12,
      fontSize: 12,
      color: meta.color,
      whiteSpace: 'nowrap',
      cursor: 'default',
    }}>
      <span>{meta.emoji}</span>
      <span>{meta.label}</span>
      <span style={{ fontWeight: 700, marginLeft: 2 }}>×{effect.stacks}</span>
    </div>
  );
  if (!meta.description) return badge;
  return (
    <Tooltip content={
      <div>
        <div style={{ fontFamily: 'Cinzel', fontSize: 11, color: meta.color, marginBottom: 4 }}>
          {meta.emoji} {meta.label} ×{effect.stacks}
        </div>
        <div style={{ color: '#a0c8a0', fontSize: 12 }}>{meta.description}</div>
      </div>
    }>
      {badge}
    </Tooltip>
  );
}

function entryColor(type: string): string {
  switch (type) {
    case 'player_attack': return '#86efac';
    case 'enemy_attack':  return '#fca5a5';
    case 'effect':        return '#c4b5fd';
    case 'system':        return '#fbbf24';
    case 'heal':          return '#4ade80';
    default:              return '#86a086';
  }
}

function entryBg(type: string): string {
  switch (type) {
    case 'player_attack': return '#0a1f0a';
    case 'enemy_attack':  return '#1f0a0a';
    case 'effect':        return '#150a1f';
    case 'system':        return '#1f1a0a';
    case 'heal':          return '#071a07';
    default:              return 'transparent';
  }
}
