import { useEffect, useRef } from 'react';
import type { CombatState, CombatLogEntry } from '../module_bindings';

interface Props {
  combat: CombatState;
  log: CombatLogEntry[];
}

export function CombatView({ combat, log }: Props) {
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

  return (
    <div style={{
      background: '#0a0f0a',
      border: '1px solid #2d3a2d',
      borderRadius: 12,
      padding: 20,
      minWidth: 320,
      maxWidth: 380,
      fontFamily: 'Crimson Text, serif',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    }}>
      <h2 style={{
        margin: 0, fontFamily: 'Cinzel', color: '#c4e8c4', fontSize: 16,
        letterSpacing: 2, textAlign: 'center',
      }}>
        ⚔️ ENCOUNTER
      </h2>

      {/* Enemy */}
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
            ⚔️ {combat.enemyAttack}
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
      </div>

      {/* Status */}
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

      {/* Tick indicator */}
      {combat.status === 'active' && (
        <div style={{ textAlign: 'center', color: '#4a6a4a', fontSize: 12, fontFamily: 'Cinzel' }}>
          Tick {combat.tick}
          <span style={{
            display: 'inline-block', marginLeft: 8,
            animation: 'pulse 1s infinite',
            color: '#4ade80',
          }}>◆</span>
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

function entryColor(type: string): string {
  switch (type) {
    case 'player_attack': return '#86efac';
    case 'enemy_attack': return '#fca5a5';
    case 'effect': return '#c4b5fd';
    case 'system': return '#fbbf24';
    default: return '#86a086';
  }
}

function entryBg(type: string): string {
  switch (type) {
    case 'player_attack': return '#0a1f0a';
    case 'enemy_attack': return '#1f0a0a';
    case 'effect': return '#150a1f';
    case 'system': return '#1f1a0a';
    default: return 'transparent';
  }
}
