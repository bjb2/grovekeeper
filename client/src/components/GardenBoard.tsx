import React, { useState } from 'react';
import type { ContainerOnBoard, PlantInContainer } from '../module_bindings';
import { CONTAINERS, SOIL_COLORS, ELEMENT_COLORS, ELEMENT_GLOW } from '../game/data';
import type { ContainerDef } from '../game/data';

const GRID_SIZE = 10;
const CELL_SIZE = 52;

interface Props {
  containers: ContainerOnBoard[];
  plants: PlantInContainer[];
  onPlaceContainer: (type: string, x: number, y: number) => void;
  onRemoveContainer: (id: bigint) => void;
  onPlacePlant: (plantType: string, containerId: bigint, slotIndex: number) => void;
  onRemovePlant: (id: bigint) => void;
  selectedTool: SelectedTool | null;
  disabled: boolean;
}

export type SelectedTool =
  | { kind: 'container'; def: ContainerDef }
  | { kind: 'plant'; plantType: string };

export function GardenBoard({
  containers, plants, onPlaceContainer, onRemoveContainer,
  onPlacePlant, onRemovePlant, selectedTool, disabled
}: Props) {
  const [hoverCell, setHoverCell] = useState<{ x: number; y: number } | null>(null);
  const [selectedContainer, setSelectedContainer] = useState<bigint | null>(null);

  const occupiedCells = new Set<string>();
  containers.forEach(c => {
    for (let dy = 0; dy < c.height; dy++) {
      for (let dx = 0; dx < c.width; dx++) {
        occupiedCells.add(`${c.x + dx},${c.y + dy}`);
      }
    }
  });

  const containerAtCell = (x: number, y: number) =>
    containers.find(c => x >= c.x && x < c.x + c.width && y >= c.y && y < c.y + c.height);

  const wouldFit = (def: ContainerDef, x: number, y: number) => {
    if (x + def.width > GRID_SIZE || y + def.height > GRID_SIZE) return false;
    for (let dy = 0; dy < def.height; dy++) {
      for (let dx = 0; dx < def.width; dx++) {
        if (occupiedCells.has(`${x + dx},${y + dy}`)) return false;
      }
    }
    return true;
  };

  const handleCellClick = (x: number, y: number) => {
    if (disabled) return;
    if (!selectedTool) {
      // Select container if clicking one
      const c = containerAtCell(x, y);
      setSelectedContainer(c ? c.id : null);
      return;
    }
    if (selectedTool.kind === 'container') {
      if (wouldFit(selectedTool.def, x, y)) {
        onPlaceContainer(selectedTool.def.type, x, y);
      }
    }
  };

  const plantsInContainer = (containerId: bigint) =>
    plants.filter(p => p.containerId === containerId);

  const isPreviewCell = (x: number, y: number): boolean => {
    if (!hoverCell || !selectedTool || selectedTool.kind !== 'container') return false;
    const { def } = selectedTool;
    return (
      x >= hoverCell.x && x < hoverCell.x + def.width &&
      y >= hoverCell.y && y < hoverCell.y + def.height
    );
  };

  const isPreviewValid = hoverCell && selectedTool?.kind === 'container'
    ? wouldFit(selectedTool.def, hoverCell.x, hoverCell.y)
    : true;

  return (
    <div style={{ display: 'flex', gap: 24 }}>
      {/* Grid */}
      <div style={{ position: 'relative' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
            gap: 2,
            background: '#0d1a0d',
            padding: 8,
            borderRadius: 12,
            border: '1px solid #2d4a2d',
            boxShadow: '0 0 40px #0a1a0a, inset 0 0 30px #0a150a',
          }}
        >
          {Array.from({ length: GRID_SIZE }, (_, y) =>
            Array.from({ length: GRID_SIZE }, (_, x) => {
              const c = containerAtCell(x, y);
              const isOrigin = c?.x === x && c?.y === y;
              const isInContainer = !!c;
              const isPreview = isPreviewCell(x, y);
              const key = `${x},${y}`;

              return (
                <div
                  key={key}
                  style={{
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    background: isInContainer
                      ? 'transparent'
                      : isPreview
                        ? isPreviewValid ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)'
                        : '#1a2e1a',
                    border: isPreview
                      ? `1px solid ${isPreviewValid ? '#4ade80' : '#ef4444'}`
                      : isInContainer
                        ? 'none'
                        : '1px solid #2a3d2a',
                    borderRadius: 4,
                    cursor: disabled ? 'default' : selectedTool ? 'crosshair' : 'pointer',
                    transition: 'background 0.1s',
                    display: isOrigin ? 'flex' : isInContainer ? 'none' : 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'visible',
                    ...(isOrigin && c ? {
                      width: c.width * CELL_SIZE + (c.width - 1) * 2,
                      height: c.height * CELL_SIZE + (c.height - 1) * 2,
                      gridColumn: `${x + 1} / span ${c.width}`,
                      gridRow: `${y + 1} / span ${c.height}`,
                      background: SOIL_COLORS[c.soilType] ?? '#3d2b1f',
                      border: selectedContainer === c.id
                        ? '2px solid #c084fc'
                        : '1px solid #5a3e2a',
                      borderRadius: 8,
                      boxShadow: selectedContainer === c.id
                        ? '0 0 16px #c084fc88'
                        : '0 2px 8px #00000080',
                      flexDirection: 'column',
                      padding: 4,
                      gap: 3,
                      cursor: disabled ? 'default' : 'pointer',
                      zIndex: 2,
                    } : {}),
                  }}
                  onClick={() => handleCellClick(x, y)}
                  onMouseEnter={() => setHoverCell({ x, y })}
                  onMouseLeave={() => setHoverCell(null)}
                >
                  {isOrigin && c && (
                    <ContainerContent
                      container={c}
                      plants={plantsInContainer(c.id)}
                      isSelected={selectedContainer === c.id}
                      selectedTool={selectedTool}
                      onPlacePlant={onPlacePlant}
                      onRemovePlant={onRemovePlant}
                      onRemoveContainer={onRemoveContainer}
                      disabled={disabled}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>
        {/* Fog overlay */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse at center, transparent 60%, #050f05 100%)',
          borderRadius: 12,
        }} />
      </div>
    </div>
  );
}

function ContainerContent({
  container, plants, isSelected, selectedTool,
  onPlacePlant, onRemovePlant, onRemoveContainer, disabled
}: {
  container: ContainerOnBoard;
  plants: PlantInContainer[];
  isSelected: boolean;
  selectedTool: SelectedTool | null;
  onPlacePlant: (pt: string, cid: bigint, slot: number) => void;
  onRemovePlant: (id: bigint) => void;
  onRemoveContainer: (id: bigint) => void;
  disabled: boolean;
}) {
  const def = CONTAINERS[container.containerType];
  const slots = Array.from({ length: container.capacity }, (_, i) => {
    return plants.find(p => p.slotIndex === i) ?? null;
  });

  const cols = Math.min(container.width * 2, container.capacity);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 2px',
      }}>
        <span style={{ fontSize: 9, color: '#86a086', fontFamily: 'Cinzel', letterSpacing: 1 }}>
          {def?.emoji} {container.affinity !== 'none' ? container.affinity.toUpperCase() : container.soilType.toUpperCase()}
        </span>
        {isSelected && !disabled && (
          <button
            onClick={(e) => { e.stopPropagation(); onRemoveContainer(container.id); }}
            style={{
              background: 'none', border: 'none', color: '#ef4444',
              cursor: 'pointer', fontSize: 10, padding: '0 2px',
            }}
          >✕</button>
        )}
      </div>
      {/* Plant slots */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 2,
        flex: 1,
      }}>
        {slots.map((plant, i) => (
          <PlantSlot
            key={i}
            plant={plant}
            slotIndex={i}
            container={container}
            selectedTool={selectedTool}
            onPlacePlant={onPlacePlant}
            onRemovePlant={onRemovePlant}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}

function PlantSlot({
  plant, slotIndex, container, selectedTool,
  onPlacePlant, onRemovePlant, disabled
}: {
  plant: PlantInContainer | null;
  slotIndex: number;
  container: ContainerOnBoard;
  selectedTool: SelectedTool | null;
  onPlacePlant: (pt: string, cid: bigint, slot: number) => void;
  onRemovePlant: (id: bigint) => void;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const canPlace = selectedTool?.kind === 'plant' && !plant && !disabled;
  const color = plant ? ELEMENT_COLORS[plant.element] : '#3a503a';
  const glow = plant ? ELEMENT_GLOW[plant.element] : undefined;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled) return;
    if (canPlace && selectedTool?.kind === 'plant') {
      onPlacePlant(selectedTool.plantType, container.id, slotIndex);
    } else if (plant && !selectedTool) {
      onRemovePlant(plant.id);
    }
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={plant ? `${plant.plantType} (${plant.element}, ${plant.power} dmg) — click to remove` : canPlace ? 'Place plant here' : 'Empty slot'}
      style={{
        borderRadius: 4,
        background: plant
          ? `${color}22`
          : canPlace && hovered
            ? '#4ade8022'
            : '#00000033',
        border: `1px solid ${plant ? color + '66' : canPlace ? '#4ade8044' : '#ffffff11'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'default' : canPlace ? 'copy' : plant ? 'pointer' : 'default',
        transition: 'all 0.15s',
        boxShadow: plant ? glow : undefined,
        minHeight: 18,
        fontSize: 12,
        userSelect: 'none',
      }}
    >
      {plant ? (
        <span title={`${plant.plantType} · ${plant.power} dmg`} style={{ fontSize: 14 }}>
          {getPlantEmoji(plant.plantType)}
        </span>
      ) : (
        <span style={{ color: '#ffffff22', fontSize: 10 }}>·</span>
      )}
    </div>
  );
}

function getPlantEmoji(type: string): string {
  const map: Record<string, string> = {
    Moonleaf: '🌿', Thornvine: '🌵', Glowcap: '🍄', Sunblossom: '🌻',
    Rotroot: '🖤', SpiritFern: '✨', Bramble: '🌿', Rotbriar: '🥀',
    Dreamcap: '💫', GroveSpirit: '🌟', RadiantFlower: '🌺',
  };
  return map[type] ?? '🌱';
}
