import type { ShopOffer, Player } from '../module_bindings';
import { CONTAINERS, PLANTS, ELEMENT_COLORS } from '../game/data';

interface Props {
  offers: ShopOffer[];
  player: Player | null;
  onBuy: (id: bigint) => void;
  onFinish: () => void;
}

export function ShopView({ offers, player, onBuy, onFinish }: Props) {
  return (
    <div style={{
      background: '#0a0f0a',
      border: '1px solid #2d3a2d',
      borderRadius: 12,
      padding: 20,
      minWidth: 340,
      maxWidth: 420,
      fontFamily: 'Crimson Text, serif',
    }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: '0 0 4px', fontFamily: 'Cinzel', color: '#fbbf24', fontSize: 18, letterSpacing: 2 }}>
          🏪 THE GROVE MARKET
        </h2>
        <div style={{ color: '#86a086', fontSize: 14 }}>
          Round {(player?.round ?? 1)} complete · {player?.currency ?? 0} 💛 Sap remaining
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
        {offers.map(offer => {
          const def = offer.itemCategory === 'container'
            ? CONTAINERS[offer.itemType]
            : PLANTS[offer.itemType];
          const canAfford = (player?.currency ?? 0) >= offer.cost;
          const element = offer.itemCategory === 'plant'
            ? PLANTS[offer.itemType]?.element
            : null;
          const color = element ? ELEMENT_COLORS[element] : '#86efac';

          return (
            <div
              key={String(offer.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 12px',
                background: offer.purchased ? '#0a150a' : '#0f1f0f',
                border: `1px solid ${offer.purchased ? '#1a2a1a' : canAfford ? '#2a4a2a' : '#2a2a1a'}`,
                borderRadius: 8,
                opacity: offer.purchased ? 0.5 : 1,
              }}
            >
              <div style={{ fontSize: 22 }}>
                {def
                  ? ('emoji' in def ? def.emoji : '🌱')
                  : '❓'}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'Cinzel', fontSize: 13,
                  color: offer.purchased ? '#4a6a4a' : '#c4e8c4',
                }}>
                  {def?.label ?? offer.itemType}
                </div>
                <div style={{ fontSize: 12, color: '#6a8a6a', marginTop: 2 }}>
                  {offer.itemCategory === 'container' && def && 'width' in def
                    ? `${def.width}×${def.height} · ${def.capacity} plants · ${def.soil}`
                    : null}
                  {offer.itemCategory === 'plant' && element
                    ? <span style={{ color }}>◆ {element}</span>
                    : null}
                </div>
              </div>
              {!offer.purchased ? (
                <button
                  onClick={() => onBuy(offer.id)}
                  disabled={!canAfford}
                  style={{
                    background: canAfford
                      ? 'linear-gradient(135deg, #1a3a2a, #2d5a3a)'
                      : '#1a1a1a',
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
                <span style={{ color: '#4a6a4a', fontSize: 12, fontFamily: 'Cinzel' }}>
                  ✓ Purchased
                </span>
              )}
            </div>
          );
        })}

        {offers.length === 0 && (
          <div style={{ color: '#4a6a4a', textAlign: 'center', padding: 20, fontSize: 14 }}>
            No items available
          </div>
        )}
      </div>

      <div style={{ borderTop: '1px solid #1a2a1a', paddingTop: 14 }}>
        <p style={{ color: '#6a8a6a', fontSize: 13, margin: '0 0 12px', fontStyle: 'italic', textAlign: 'center' }}>
          Purchased items appear in your Build toolbar.
        </p>
        <button
          onClick={onFinish}
          style={{
            width: '100%',
            background: 'linear-gradient(135deg, #1a3a2a, #2d5a3a)',
            border: '1px solid #4ade80',
            borderRadius: 8,
            color: '#4ade80',
            fontFamily: 'Cinzel',
            fontSize: 14,
            padding: '12px',
            cursor: 'pointer',
            letterSpacing: 1,
            boxShadow: '0 0 12px #4ade8044',
          }}
        >
          🌿 Return to Grove
        </button>
      </div>
    </div>
  );
}
