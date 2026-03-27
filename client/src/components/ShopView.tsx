import type { ShopOffer, Player } from '../module_bindings/types';
import { CONTAINERS, PLANTS, ELEMENT_COLORS, EFFECT_META } from '../game/data';
import type { PlantDef, ContainerDef } from '../game/data';
import { Tooltip } from './Tooltip';

const RARITY_COLORS: Record<string, string> = {
  common: '#4a6a4a',
  uncommon: '#4ade80',
  rare: '#60a5fa',
  epic: '#a855f7',
  legendary: '#f59e0b',
};

interface Props {
  offers: ShopOffer[];
  player: Player | null;
  onBuy: (id: bigint) => void;
  onReroll: () => void;
}

// ─── Tooltip content for plants ───────────────────────────────────────────────

export function PlantTooltipContent({ def }: { def: PlantDef }) {
  const color = ELEMENT_COLORS[def.element] ?? '#4ade80';
  const effMeta = EFFECT_META[def.primaryEffect];
  const secMeta = def.primaryEffect !== def.primaryEffect ? null : null; // secondary lookup below

  const triggerLine = (() => {
    if (def.triggerType === 'periodic') return `Every ${(def.cooldownMs / 1000).toFixed(1)}s`;
    if (def.triggerType === 'on_enemy_attack') return 'On enemy attack';
    if (def.triggerType === 'passive') return 'Passive (combat start)';
    if (def.triggerType === 'start') return 'Once at combat start';
    return def.triggerType;
  })();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {def.image
          ? <img src={def.image} style={{ width: 28, height: 28, objectFit: 'contain' }} />
          : <span style={{ fontSize: 20 }}>{def.emoji}</span>}
        <span style={{ fontFamily: 'Cinzel', fontSize: 13, color: '#c4e8c4' }}>{def.label}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color, border: `1px solid ${color}55`, borderRadius: 4, padding: '1px 6px' }}>
          ◆ {def.element}
        </span>
        <span style={{ fontSize: 11, color: '#86efac', border: '1px solid #2a4a2a', borderRadius: 4, padding: '1px 6px' }}>
          {def.width}×{def.height}
        </span>
        <span style={{ fontSize: 11, color: '#6a8a6a', border: '1px solid #2a3a2a', borderRadius: 4, padding: '1px 6px' }}>
          {triggerLine}
        </span>
      </div>
      <div style={{ fontSize: 12, color: '#86a086', marginBottom: 4 }}>{def.description}</div>
      {effMeta && (
        <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid #1a2a1a' }}>
          <div style={{ fontSize: 11, color: effMeta.color, marginBottom: 2 }}>
            {effMeta.emoji} <strong>{effMeta.label}</strong>
          </div>
          <div style={{ fontSize: 11, color: '#7a9a7a' }}>{effMeta.description}</div>
        </div>
      )}
    </div>
  );
}

// ─── Tooltip content for containers ──────────────────────────────────────────

export function ContainerTooltipContent({ def }: { def: ContainerDef }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        {def.image
          ? <img src={def.image} style={{ width: 28, height: 28, objectFit: 'contain' }} />
          : <span style={{ fontSize: 20 }}>{def.emoji}</span>}
        <span style={{ fontFamily: 'Cinzel', fontSize: 13, color: '#c4e8c4' }}>{def.label}</span>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11, color: '#86efac', border: '1px solid #2a4a2a', borderRadius: 4, padding: '1px 6px' }}>
          {def.width}×{def.height} grid
        </span>
        <span style={{ fontSize: 11, color: '#86efac', border: '1px solid #2a4a2a', borderRadius: 4, padding: '1px 6px' }}>
          {def.capacity} plant{def.capacity !== 1 ? 's' : ''}
        </span>
        <span style={{ fontSize: 11, color: '#6a8a6a', border: '1px solid #2a3a2a', borderRadius: 4, padding: '1px 6px' }}>
          {def.soil} soil
        </span>
        {def.affinity !== 'none' && (
          <span style={{ fontSize: 11, color: ELEMENT_COLORS[def.affinity] ?? '#4ade80', border: `1px solid ${ELEMENT_COLORS[def.affinity] ?? '#4ade80'}55`, borderRadius: 4, padding: '1px 6px' }}>
            {def.affinity} affinity
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: '#86a086' }}>{def.description}</div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function ShopView({ offers, player, onBuy, onReroll }: Props) {
  const rerollCount = player?.rerollCount ?? 0;
  const rerollCost = (rerollCount + 1) * 10;
  const canReroll = (player?.currency ?? 0) >= rerollCost;

  return (
    <div style={{
      background: '#0a0f0a',
      border: '1px solid #2d3a2d',
      borderRadius: 12,
      padding: '16px 14px',
      minWidth: 0,
      maxWidth: 420,
      fontFamily: 'Crimson Text, serif',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px', fontFamily: 'Cinzel', color: '#fbbf24', fontSize: 18, letterSpacing: 2 }}>
          🏪 THE GROVE MARKET
        </h2>
        <div style={{ color: '#86a086', fontSize: 14 }}>
          Round {player?.round ?? 1} · {player?.currency ?? 0} 💛 Sap
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {offers.map(offer => {
          const isPlant = offer.itemCategory === 'plant';
          const plantDef = isPlant ? PLANTS[offer.itemType] : undefined;
          const containerDef = !isPlant ? CONTAINERS[offer.itemType] : undefined;
          const def = plantDef ?? containerDef;
          const canAfford = (player?.currency ?? 0) >= offer.cost;
          const element = plantDef?.element ?? null;
          const color = element ? ELEMENT_COLORS[element] : '#86efac';
          const rarityColor = RARITY_COLORS[offer.rarity] ?? '#4a6a4a';
          const borderColor = offer.purchased ? '#1a2a1a' : rarityColor + '66';

          const card = (
            <div
              key={String(offer.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: offer.purchased ? '#0a150a' : '#0f1f0f',
                border: `1px solid ${borderColor}`,
                borderRadius: 8,
                opacity: offer.purchased ? 0.5 : 1,
                boxShadow: offer.purchased || offer.rarity === 'common' ? 'none' : `0 0 8px ${rarityColor}22`,
              }}
            >
              <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {def?.image
                  ? <img src={def.image} style={{ width: 36, height: 36, objectFit: 'contain' }} />
                  : <span style={{ fontSize: 22 }}>{def ? def.emoji : '❓'}</span>}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontFamily: 'Cinzel', fontSize: 13,
                    color: offer.purchased ? '#4a6a4a' : '#c4e8c4',
                  }}>
                    {def?.label ?? offer.itemType}
                  </span>
                  {offer.rarity !== 'common' && (
                    <span style={{
                      fontSize: 9, fontFamily: 'Cinzel', letterSpacing: 1,
                      color: rarityColor, border: `1px solid ${rarityColor}55`,
                      borderRadius: 4, padding: '1px 4px',
                    }}>
                      {offer.rarity.toUpperCase()}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: '#6a8a6a', marginTop: 2 }}>
                  {containerDef
                    ? `${containerDef.width}×${containerDef.height} · ${containerDef.capacity} plants · ${containerDef.soil}`
                    : plantDef
                      ? <span><span style={{ color }}>◆ {element}</span><span style={{ color: '#4a7a4a', marginLeft: 6 }}>{plantDef.width}×{plantDef.height}</span></span>
                      : null}
                </div>
              </div>
              {!offer.purchased ? (
                <button
                  onClick={() => onBuy(offer.id)}
                  disabled={!canAfford}
                  style={{
                    background: canAfford ? 'linear-gradient(135deg, #1a3a2a, #2d5a3a)' : '#1a1a1a',
                    border: `1px solid ${canAfford ? '#4ade80' : '#3a3a2a'}`,
                    borderRadius: 6,
                    color: canAfford ? '#fbbf24' : '#5a5a3a',
                    fontFamily: 'Cinzel',
                    fontSize: 13,
                    padding: '6px 12px',
                    cursor: canAfford ? 'pointer' : 'not-allowed',
                    whiteSpace: 'nowrap',
                    boxShadow: canAfford ? '0 0 8px #4ade8033' : 'none',
                  }}
                >
                  {offer.cost} 💛
                </button>
              ) : (
                <span style={{ color: '#4a6a4a', fontSize: 12, fontFamily: 'Cinzel' }}>✓ Purchased</span>
              )}
            </div>
          );

          const tooltipContent = plantDef
            ? <PlantTooltipContent def={plantDef} />
            : containerDef
              ? <ContainerTooltipContent def={containerDef} />
              : null;

          return tooltipContent ? (
            <Tooltip key={String(offer.id)} content={tooltipContent}>{card}</Tooltip>
          ) : card;
        })}

        {offers.length === 0 && (
          <div style={{ color: '#4a6a4a', textAlign: 'center', padding: 20, fontSize: 14 }}>
            No items available
          </div>
        )}
      </div>

      {/* Reroll button */}
      <div style={{
        borderTop: '1px solid #1a2a1a',
        paddingTop: 12,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
      }}>
        <div style={{ fontSize: 12, color: '#4a6a4a', fontStyle: 'italic' }}>
          {rerollCount === 0
            ? 'Refresh offers for Sap'
            : `Rerolled ${rerollCount}×`}
        </div>
        <button
          onClick={onReroll}
          disabled={!canReroll}
          title={canReroll ? `Reroll shop for ${rerollCost} Sap` : `Need ${rerollCost} Sap to reroll`}
          style={{
            background: canReroll ? 'linear-gradient(135deg, #1a2a3a, #2d3a5a)' : '#111',
            border: `1px solid ${canReroll ? '#60a5fa' : '#2a2a3a'}`,
            borderRadius: 6,
            color: canReroll ? '#93c5fd' : '#3a3a5a',
            fontFamily: 'Cinzel',
            fontSize: 12,
            padding: '6px 14px',
            cursor: canReroll ? 'pointer' : 'not-allowed',
            whiteSpace: 'nowrap',
            boxShadow: canReroll ? '0 0 8px #60a5fa22' : 'none',
            transition: 'all 0.15s',
          }}
        >
          🔀 Reroll — {rerollCost} 💛
        </button>
      </div>
    </div>
  );
}
