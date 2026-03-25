import { useState } from 'react';
import { useGrovekeeper } from './hooks/useGrovekeeper';
import { GardenBoard, type SelectedTool } from './components/GardenBoard';
import { Toolbar } from './components/Toolbar';
import { CombatView } from './components/CombatView';
import { ShopView } from './components/ShopView';
import './styles/global.css';

export default function App() {
  const {
    connected, error, player, containers, plants,
    combat, combatLog, shopOffers,
    placeContainer, removeContainer, placePlant, removePlant,
    startCombat, buyItem, finishShopping, resetRun,
  } = useGrovekeeper();

  const [selectedTool, setSelectedTool] = useState<SelectedTool | null>(null);

  const phase = player?.phase ?? 'build';
  const isBuild = phase === 'build';
  const isCombat = phase === 'combat';
  const isShop = phase === 'shop';

  return (
    <div className="app-root">
      {/* Background particles */}
      <div className="bg-particles" />

      {/* Header */}
      <header className="header">
        <h1 className="title">🌿 GROVEKEEPER</h1>
        <div className="subtitle">Sacred Garden Auto-Battler</div>
        <div className="connection-status">
          <span className={`dot ${connected ? 'connected' : 'disconnected'}`} />
          {connected ? 'Connected' : 'Connecting...'}
        </div>
      </header>

      {/* Phase banner */}
      {player && (
        <div className={`phase-banner phase-${phase}`}>
          {isBuild && '🌱 BUILD PHASE — Place containers and plants, then begin the encounter'}
          {isCombat && '⚔️ COMBAT PHASE — Your grove fights automatically'}
          {isShop && '🏪 SHOP PHASE — Spend your Sap to expand your grove'}
        </div>
      )}

      {error && (
        <div className="error-banner">
          ⚠️ Connection error: {error}. Make sure VITE_SPACETIME_HOST and VITE_SPACETIME_MODULE are set.
        </div>
      )}

      {!connected && !error && (
        <div className="loading">
          <div className="loading-spinner">🌿</div>
          <div>Awakening the Grove...</div>
        </div>
      )}

      {connected && (
        <main className="main-layout">
          {/* Left: Toolbar */}
          <aside className="sidebar">
            <Toolbar
              player={player}
              selectedTool={isBuild ? selectedTool : null}
              onSelectTool={isBuild ? setSelectedTool : () => {}}
              onStartCombat={startCombat}
              onResetRun={resetRun}
              disabled={!isBuild}
            />
          </aside>

          {/* Center: Garden Board */}
          <div className="board-area">
            <GardenBoard
              containers={containers}
              plants={plants}
              onPlaceContainer={(type, x, y) => {
                placeContainer(type, x, y);
                setSelectedTool(null);
              }}
              onRemoveContainer={removeContainer}
              onPlacePlant={(pt, cid, slot) => {
                placePlant(pt, cid, slot);
                setSelectedTool(null);
              }}
              onRemovePlant={removePlant}
              selectedTool={isBuild ? selectedTool : null}
              disabled={!isBuild}
            />

            {/* Instructions */}
            {isBuild && !selectedTool && (
              <div className="hint">
                Select a container or plant from the toolbar, then click the grid to place it.
                Click a placed container or plant to remove it.
              </div>
            )}
            {isBuild && selectedTool?.kind === 'container' && (
              <div className="hint placing">
                Click an empty area to place <strong>{selectedTool.def.label}</strong> ({selectedTool.def.width}×{selectedTool.def.height})
              </div>
            )}
            {isBuild && selectedTool?.kind === 'plant' && (
              <div className="hint placing">
                Click an empty plant slot to place <strong>{selectedTool.plantType}</strong>
              </div>
            )}
          </div>

          {/* Right: Combat / Shop */}
          <div className="right-panel">
            {(isCombat || combat) && combat && (
              <CombatView combat={combat} log={combatLog} />
            )}
            {isShop && (
              <ShopView
                offers={shopOffers}
                player={player}
                onBuy={buyItem}
                onFinish={finishShopping}
              />
            )}
            {isBuild && !combat && (
              <div className="grove-lore">
                <h3>🌙 Grove Lore</h3>
                <p>You are a Grovekeeper, caretaker of a living sacred garden whose plants awaken to fight.</p>
                <p>Place containers on your garden, fill them with mystical plants, then send your grove into battle.</p>
                <div className="lore-tips">
                  <div className="tip">🌿 Matching soil type to plant element grants bonus power</div>
                  <div className="tip">⚔️ Fill containers to unlock bonus effects</div>
                  <div className="tip">✨ Spirit plants shine in Rune Circles</div>
                  <div className="tip">🍄 Fungus plants thrive in the Stone Basin</div>
                </div>
              </div>
            )}
          </div>
        </main>
      )}
    </div>
  );
}
