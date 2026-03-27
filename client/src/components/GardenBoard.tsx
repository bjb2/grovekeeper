import { useCallback, useState, useRef, useEffect, useId } from 'react';
import { useDroppable, useDraggable, useDndContext } from '@dnd-kit/core';
import type { ContainerOnBoard, PlantInContainer } from '../module_bindings/types';
import { CONTAINERS, PLANTS, SOIL_COLORS, ELEMENT_COLORS, ELEMENT_GLOW } from '../game/data';
import type { ContainerDef } from '../game/data';
import { Tooltip } from './Tooltip';
import { PlantTooltipContent } from './ShopView';

const GRID_SIZE = 6;

// ─── Floating combat numbers ──────────────────────────────────────────────────

interface FloatNum {
  id: number;
  text: string;
  color: string;
  x: number; // px offset from plant center
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
const CELL_SIZE = 68;
const GAP = 2;
const PADDING = 8;
// Pixel offset from board top-left to the start of cell (x, y)
const cellPx = (coord: number) => PADDING + coord * (CELL_SIZE + GAP);

// Drag payload shapes
export type DragData =
  | { kind: 'inventory-container'; inventoryId: bigint; containerType: string; def: ContainerDef }
  | { kind: 'placed-container'; containerId: bigint; containerType: string; def: ContainerDef }
  | { kind: 'inventory-plant'; inventoryId: bigint; plantType: string }
  | { kind: 'placed-plant'; plantId: bigint; plantType: string; fromBoardX: number; fromBoardY: number };

interface Props {
  containers: ContainerOnBoard[];
  plants: PlantInContainer[];
  onRemoveContainer: (id: bigint) => void;
  onRemovePlant: (id: bigint) => void;
  onRotateContainer: (id: bigint) => void;
  onRotatePlant?: (id: bigint) => void;
  isDisabled: boolean;
  liftedPlantId: bigint | null;
  isCombatActive: boolean;
  dragRotated?: boolean;
  isMobile?: boolean;
}

const noop = () => {};

export function GardenBoard({ containers, plants, onRemoveContainer, onRemovePlant, onRotateContainer, onRotatePlant = noop, isDisabled, liftedPlantId, isCombatActive, dragRotated = false, isMobile = false }: Props) {
  const { active, over } = useDndContext();

  const dragData = active?.data.current as DragData | undefined;
  const isDraggingContainer =
    dragData?.kind === 'inventory-container' || dragData?.kind === 'placed-container';
  const isDraggingAnyPlant =
    dragData?.kind === 'inventory-plant' || dragData?.kind === 'placed-plant';
  const dragDef: ContainerDef | null =
    isDraggingContainer ? (dragData as any).def : null;

  const effectiveDef: ContainerDef | null = dragDef && dragRotated && dragDef.width !== dragDef.height
    ? { ...dragDef, width: dragDef.height, height: dragDef.width }
    : dragDef;

  const previewOrigin = (() => {
    if (!isDraggingContainer || !over) return null;
    const id = over.id as string;
    if (!id.startsWith('cell:')) return null;
    const [, xs, ys] = id.split(':');
    return { x: parseInt(xs), y: parseInt(ys) };
  })();

  const draggingContainerId =
    dragData?.kind === 'placed-container' ? dragData.containerId : null;

  const occupiedCells = new Set<string>();
  containers.forEach(c => {
    if (draggingContainerId !== null && c.id === draggingContainerId) return;
    for (let dy = 0; dy < c.height; dy++)
      for (let dx = 0; dx < c.width; dx++)
        occupiedCells.add(`${c.x + dx},${c.y + dy}`);
  });

  const containerAtCell = (x: number, y: number) =>
    containers.find(c => x >= c.x && x < c.x + c.width && y >= c.y && y < c.y + c.height);

  const wouldFit = (def: ContainerDef, ox: number, oy: number) => {
    if (ox < 0 || oy < 0 || ox + def.width > GRID_SIZE || oy + def.height > GRID_SIZE) return false;
    for (let dy = 0; dy < def.height; dy++)
      for (let dx = 0; dx < def.width; dx++)
        if (occupiedCells.has(`${ox + dx},${oy + dy}`)) return false;
    return true;
  };

  const isPreviewCell = (x: number, y: number) => {
    if (!previewOrigin || !effectiveDef) return false;
    return (
      x >= previewOrigin.x && x < previewOrigin.x + effectiveDef.width &&
      y >= previewOrigin.y && y < previewOrigin.y + effectiveDef.height
    );
  };

  const isPreviewValid = previewOrigin && effectiveDef
    ? wouldFit(effectiveDef, previewOrigin.x, previewOrigin.y)
    : true;

  // Board cells covered by non-anchor cells of multi-cell plants (excluding lifted plant)
  const coveredBoardCells = new Set<string>();
  plants.forEach(p => {
    if (liftedPlantId !== null && p.id === liftedPlantId) return;
    const W = p.plantWidth ?? 1, H = p.plantHeight ?? 1;
    for (let dr = 0; dr < H; dr++)
      for (let dc = 0; dc < W; dc++)
        if (dr > 0 || dc > 0)
          coveredBoardCells.add(`${p.boardX + dc}:${p.boardY + dr}`);
  });

  // Set of board cells occupied by any plant (anchor cells, excluding lifted)
  const occupiedByPlant = new Set<string>();
  plants.forEach(p => {
    if (liftedPlantId !== null && p.id === liftedPlantId) return;
    occupiedByPlant.add(`${p.boardX}:${p.boardY}`);
  });

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gridTemplateRows: `repeat(${GRID_SIZE}, ${CELL_SIZE}px)`,
          gap: GAP,
          background: '#0d1a0d',
          padding: PADDING,
          borderRadius: 12,
          border: '1px solid #2d4a2d',
          boxShadow: '0 0 40px #0a1a0a, inset 0 0 30px #0a150a',
          // position+zIndex establishes a stacking context so the absolute
          // preview overlay (z-index 50) reliably paints above container cells
          // (z-index 2) without interacting with the CSS Grid track layout.
          position: 'relative',
          zIndex: 0,
        }}
      >
        {Array.from({ length: GRID_SIZE }, (_, y) =>
          Array.from({ length: GRID_SIZE }, (_, x) => {
            const c = containerAtCell(x, y);
            const isOrigin = c?.x === x && c?.y === y;
            return (
              <BoardCell
                key={`${x}:${y}`}
                x={x} y={y}
                isInContainer={!!c}
                isOrigin={!!isOrigin}
                container={isOrigin ? c : undefined}
                allPlants={plants}
                coveredBoardCells={coveredBoardCells}
                occupiedByPlant={occupiedByPlant}
                isDisabled={isDisabled}
                isDraggingContainer={isDraggingContainer}
                isDraggingAnyPlant={isDraggingAnyPlant}
                liftedPlantId={liftedPlantId}
                isCombatActive={isCombatActive}
                onRemoveContainer={onRemoveContainer}
                onRemovePlant={onRemovePlant}
                onRotateContainer={onRotateContainer}
                isMobile={isMobile}
              />
            );
          })
        )}

        {/* Preview highlight: absolute inside grid div so it never affects
            grid track layout. Bounds-checked so it doesn't overhang the board. */}
        {previewOrigin && effectiveDef &&
         previewOrigin.x + effectiveDef.width <= GRID_SIZE &&
         previewOrigin.y + effectiveDef.height <= GRID_SIZE && (
          <div
            style={{
              position: 'absolute',
              left: cellPx(previewOrigin.x),
              top: cellPx(previewOrigin.y),
              width: effectiveDef.width * CELL_SIZE + (effectiveDef.width - 1) * GAP,
              height: effectiveDef.height * CELL_SIZE + (effectiveDef.height - 1) * GAP,
              zIndex: 50,
              background: isPreviewValid ? 'rgba(74,222,128,0.25)' : 'rgba(239,68,68,0.25)',
              border: `2px solid ${isPreviewValid ? '#4ade80' : '#ef4444'}`,
              borderRadius: 8,
              boxShadow: isPreviewValid ? '0 0 16px #4ade8055' : '0 0 16px #ef444455',
              pointerEvents: 'none',
              transition: 'background 0.1s, border-color 0.1s, box-shadow 0.1s',
            }}
          />
        )}
      </div>

      {/* Plant overlays — always mounted so useDraggable stays registered during drag */}
      {plants.map(p => (
        <PlantOverlay
          key={p.id.toString()}
          plant={p}
          isDisabled={isDisabled}
          isCombatActive={isCombatActive}
          onRemovePlant={onRemovePlant}
          onRotatePlant={onRotatePlant}
        />
      ))}

      {/* Vignette */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 60%, #050f05 100%)',
        borderRadius: 12,
        zIndex: 20,
      }} />
    </div>
  );
}

// ─── Board Cell ───────────────────────────────────────────────────────────────

function BoardCell({
  x, y, isInContainer, isOrigin, container, allPlants, coveredBoardCells, occupiedByPlant,
  isDisabled, isDraggingContainer, isDraggingAnyPlant,
  liftedPlantId, isCombatActive, onRemoveContainer, onRemovePlant, onRotateContainer,
  isMobile,
}: {
  x: number; y: number;
  isInContainer: boolean; isOrigin: boolean;
  container?: ContainerOnBoard;
  allPlants: PlantInContainer[];
  coveredBoardCells: Set<string>;
  occupiedByPlant: Set<string>;
  isDisabled: boolean; isDraggingContainer: boolean; isDraggingAnyPlant: boolean;
  liftedPlantId: bigint | null;
  isCombatActive: boolean;
  onRemoveContainer: (id: bigint) => void;
  onRemovePlant: (id: bigint) => void;
  onRotateContainer: (id: bigint) => void;
  isMobile: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `cell:${x}:${y}`,
    // Disable for plant drags — plants only drop into plant slots or the stash
    disabled: (isInContainer && !isDraggingContainer) || isDisabled || isDraggingAnyPlant,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        width: CELL_SIZE, height: CELL_SIZE,
        background: isInContainer ? 'transparent' : '#1a2e1a',
        border: isInContainer ? 'none' : '1px solid #2a3d2a',
        borderRadius: 4,
        cursor: isDisabled ? 'default' : isDraggingContainer && !isInContainer ? 'copy' : 'default',
        transition: 'background 0.1s, border 0.1s',
        display: isOrigin ? 'flex' : isInContainer ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'visible',
        ...(isOrigin && container ? (() => {
          const cDef = CONTAINERS[container.containerType];
          return {
            width: container.width * CELL_SIZE + (container.width - 1) * GAP,
            height: container.height * CELL_SIZE + (container.height - 1) * GAP,
            gridColumn: `${x + 1} / span ${container.width}`,
            gridRow: `${y + 1} / span ${container.height}`,
            background: cDef?.image ? 'transparent' : (SOIL_COLORS[container.soilType] ?? '#3d2b1f'),
            border: cDef?.image ? 'none' : '1px solid #5a3e2a',
            borderRadius: 8,
            boxShadow: '0 2px 8px #00000080',
            flexDirection: 'column' as const,
            padding: 3, gap: 0,
            cursor: 'default',
            zIndex: 2,
          };
        })() : {}),
      }}
    >
      {isOrigin && container && (
        <ContainerContent
          container={container}
          allPlants={allPlants}
          coveredBoardCells={coveredBoardCells}
          occupiedByPlant={occupiedByPlant}
          isDisabled={isDisabled}
          liftedPlantId={liftedPlantId}
          isCombatActive={isCombatActive}
          onRemovePlant={onRemovePlant}
          onRemoveContainer={onRemoveContainer}
          onRotateContainer={onRotateContainer}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

// ─── Container Content ────────────────────────────────────────────────────────

function ContainerContent({ container, allPlants, coveredBoardCells, occupiedByPlant, isDisabled, liftedPlantId, isCombatActive, onRemovePlant, onRemoveContainer, onRotateContainer, isMobile }: {
  container: ContainerOnBoard;
  allPlants: PlantInContainer[];
  coveredBoardCells: Set<string>;
  occupiedByPlant: Set<string>;
  isDisabled: boolean;
  liftedPlantId: bigint | null;
  isCombatActive: boolean;
  onRemovePlant: (id: bigint) => void;
  onRemoveContainer: (id: bigint) => void;
  onRotateContainer: (id: bigint) => void;
  isMobile: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const def = CONTAINERS[container.containerType];

  // Map from "boardX:boardY" -> plant for plants anchored in this container
  const plantAtCell = new Map<string, PlantInContainer>();
  allPlants
    .filter(p => p.containerId === container.id)
    .forEach(p => plantAtCell.set(`${p.boardX}:${p.boardY}`, p));

  const numRows = Math.ceil(container.capacity / container.width);

  const { setNodeRef: setDragRef, listeners, attributes, isDragging } = useDraggable({
    id: `placed-container:${container.id.toString()}`,
    disabled: isDisabled,
    data: def ? {
      kind: 'placed-container',
      containerId: container.id,
      containerType: container.containerType,
      def,
    } : undefined,
  });

  const tooltipParts = [
    def?.label ?? container.containerType,
    `${container.width}×${container.height} · ${container.capacity} slots`,
    container.affinity !== 'none' ? `${container.affinity} affinity` : `${container.soilType} soil`,
    !isDisabled ? 'drag to move' : null,
  ].filter(Boolean).join('\n');

  return (
    <div
      style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', opacity: isDragging ? 0.35 : 1, position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Container image — centered, fills entire cell, behind all content */}
      {def?.image && (
        <img
          src={def.image}
          draggable={false}
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'fill',
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}
      {/* Thin drag-handle strip */}
      <div
        ref={setDragRef}
        {...(isDisabled ? {} : listeners)}
        {...(isDisabled ? {} : attributes)}
        title={tooltipParts}
        onContextMenu={e => { e.preventDefault(); if (!isDisabled) onRotateContainer(container.id); }}
        style={{
          height: 7,
          flexShrink: 0,
          borderRadius: '3px 3px 0 0',
          background: hovered && !isDisabled ? '#ffffff18' : '#ffffff08',
          cursor: isDisabled ? 'default' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          transition: 'background 0.15s',
        }}
      />

      {/* Hover buttons — remove + rotate */}
      {!isDisabled && (hovered || isMobile) && (
        <>
          {container.width !== container.height && (
            isMobile ? (
              <button
                onPointerDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); onRotateContainer(container.id); }}
                title="Rotate container"
                style={{
                  position: 'absolute', top: 0, left: 0,
                  background: '#050a1a99', border: '1px solid #4ade8033',
                  borderRadius: '3px 0 4px 0',
                  color: '#4ade80bb', cursor: 'pointer',
                  fontSize: 9, lineHeight: 1, padding: '3px 5px',
                  zIndex: 10,
                }}
              >↻</button>
            ) : (
              <div style={{
                position: 'absolute', top: 0, left: 0,
                background: '#050a1a99',
                borderRadius: '3px 0 4px 0',
                color: '#4ade8077',
                fontSize: 7, lineHeight: 1, padding: '2px 4px',
                zIndex: 10, pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}>right-click to rotate</div>
            )
          )}
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onRemoveContainer(container.id); }}
            title="Stash container (returns all contents)"
            style={{
              position: 'absolute', top: 0, right: 0,
              background: '#1a0505', border: '1px solid #ef444433',
              borderRadius: '0 3px 0 4px',
              color: '#ef4444bb', cursor: 'pointer',
              fontSize: 8, lineHeight: 1, padding: isMobile ? '3px 5px' : '2px 4px',
              zIndex: 10,
            }}
          >✕</button>
        </>
      )}

      {/* Drop-target slot grid — visual plants are rendered as board overlays */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${container.width}, 1fr)`,
        gridTemplateRows: `repeat(${numRows}, 1fr)`,
        gap: GAP,
        flex: 1,
      }}>
        {Array.from({ length: container.capacity }, (_, i) => {
          const col = i % container.width;
          const row = Math.floor(i / container.width);
          const boardX = container.x + col;
          const boardY = container.y + row;

          // Skip cells covered by non-anchor cells of multi-cell plants
          if (coveredBoardCells.has(`${boardX}:${boardY}`)) return null;

          // Is this cell occupied by a plant anchor?
          const isOccupied = occupiedByPlant.has(`${boardX}:${boardY}`);
          // Is the occupying plant the lifted one?
          const occupant = plantAtCell.get(`${boardX}:${boardY}`) ?? null;
          const isLifted = occupant !== null && liftedPlantId === occupant.id;

          return (
            <PlantSlot
              key={i}
              boardX={boardX}
              boardY={boardY}
              isOccupied={isOccupied && !isLifted}
              isLifted={isLifted}
              gridCol={col + 1}
              gridRow={row + 1}
              isDisabled={isDisabled}
              liftedPlantId={liftedPlantId}
            />
          );
        })}
      </div>
    </div>
  );
}

// ─── Plant Slot (drop target only — visuals handled by PlantOverlay) ──────────

function PlantSlot({ boardX, boardY, isOccupied, isLifted, gridCol, gridRow, isDisabled, liftedPlantId }: {
  boardX: number;
  boardY: number;
  isOccupied: boolean;
  isLifted: boolean;
  gridCol: number;
  gridRow: number;
  isDisabled: boolean;
  liftedPlantId: bigint | null;
}) {
  const { active } = useDndContext();
  const dragData = active?.data.current as DragData | undefined;
  const isDraggingAnyPlant =
    dragData?.kind === 'inventory-plant' || dragData?.kind === 'placed-plant';
  const isDraggingAnyContainer =
    dragData?.kind === 'inventory-container' || dragData?.kind === 'placed-container';

  // Available as drop target if empty or the lifted plant's anchor
  const canDrop = !isOccupied || isLifted;

  const { setNodeRef, isOver } = useDroppable({
    id: `plantslot:${boardX}:${boardY}`,
    disabled: isDisabled || !canDrop || isDraggingAnyContainer,
  });

  const canReceive = isDraggingAnyPlant && canDrop && !isDisabled;

  return (
    <div
      ref={setNodeRef}
      style={{
        gridColumn: `${gridCol}`,
        gridRow: `${gridRow}`,
        borderRadius: 4,
        background: isLifted ? '#4ade8011'
          : isOccupied ? 'transparent'
          : isOver && canReceive ? '#4ade8033'
          : canReceive ? '#4ade8011'
          : 'transparent',
        border: `1px solid ${
          isLifted ? '#4ade8033'
          : isOccupied ? 'transparent'
          : isOver && canReceive ? '#4ade80'
          : canReceive ? '#4ade8044'
          : 'transparent'
        }`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        boxShadow: isOver && canReceive ? '0 0 8px #4ade8066' : 'none',
        minHeight: 18,
        userSelect: 'none', touchAction: 'none',
        // Slot sits behind the plant overlay — pointer events only needed when empty
        pointerEvents: isOccupied && !isLifted ? 'none' : 'auto',
      }}
    >
      {!isOccupied && canReceive && (
        <span style={{ color: '#ffffff44', fontSize: 10 }}>·</span>
      )}
    </div>
  );
}

// ─── Plant Overlay (absolutely positioned on the board, draggable) ─────────────

function PlantOverlay({ plant, isDisabled, isCombatActive, onRemovePlant, onRotatePlant }: {
  plant: PlantInContainer;
  isDisabled: boolean;
  isCombatActive: boolean;
  onRemovePlant: (id: bigint) => void;
  onRotatePlant: (id: bigint) => void;
}) {
  const { active } = useDndContext();
  const dragData = active?.data.current as DragData | undefined;
  const isDraggingAnyPlant =
    dragData?.kind === 'inventory-plant' || dragData?.kind === 'placed-plant';

  // Track whether a real drag happened so onClick doesn't mis-fire after a drag
  const didDragRef = useRef(false);

  // Pop animation + floating numbers
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
        void el.offsetHeight; // force reflow
        el.style.animation = 'plant-pop 380ms cubic-bezier(0.36, 0.07, 0.19, 0.97) forwards';
      }

      // Spawn floating numbers for primary + secondary effects
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

  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `placed-plant:${plant.id.toString()}`,
    disabled: isDisabled,
    data: {
      kind: 'placed-plant',
      plantId: plant.id,
      plantType: plant.plantType,
      fromBoardX: plant.boardX,
      fromBoardY: plant.boardY,
    },
  });

  // Mark drag started so onClick does not mis-fire after drag release
  const wrappedListeners = listeners ? {
    ...listeners,
    onPointerDown: (e: React.PointerEvent) => {
      didDragRef.current = false;
      listeners.onPointerDown?.(e);
    },
    onPointerMove: (e: React.PointerEvent) => {
      didDragRef.current = true;
      listeners.onPointerMove?.(e);
    },
  } : listeners;

  const color = ELEMENT_COLORS[plant.element] ?? '#4ade80';
  const plantDef = PLANTS[plant.plantType];
  const hasImage = !!plantDef?.image;
  // Detect if plant has been rotated from its default orientation
  const isRotated = !!plantDef && plantDef.width !== plantDef.height && plant.plantWidth !== plantDef.width;

  const overlayDiv = (
    <div
      ref={popRef}
      style={{
        position: 'absolute',
        left, top, width, height,
        zIndex: 5,
        pointerEvents: (isDisabled || isDragging) ? 'none' : 'auto',
        opacity: isDragging ? 0 : 1,
      }}
    >
      <div
        ref={setNodeRef}
        {...(isDisabled ? {} : wrappedListeners)}
        {...(isDisabled ? {} : attributes)}
        onClick={e => {
          e.stopPropagation();
          if (!isDisabled && !didDragRef.current) onRemovePlant(plant.id);
          didDragRef.current = false;
        }}
        onContextMenu={e => {
          e.preventDefault();
          e.stopPropagation();
          if (!isDisabled && plant.plantWidth !== plant.plantHeight) onRotatePlant(plant.id);
        }}
        style={{
          width: '100%', height: '100%',
          borderRadius: 4,
          background: hasImage ? 'transparent' : `${color}22`,
          border: hasImage ? 'none' : `1px solid ${color}66`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: isDisabled ? 'default' : 'grab',
          userSelect: 'none', touchAction: 'none',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Plant image or emoji fallback */}
        {hasImage
          ? (
            <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
              <img
                src={plantDef!.image}
                draggable={false}
                style={{
                  position: 'absolute', top: '50%', left: '50%',
                  // If rotated: image natural dims are swapped vs the overlay box dims
                  width: isRotated ? height : width,
                  height: isRotated ? width : height,
                  objectFit: 'contain',
                  transform: `translate(-50%, -50%)${isRotated ? ' rotate(90deg)' : ''}`,
                  pointerEvents: 'none', display: 'block',
                }}
              />
            </div>
          )
          : <>
              <span style={{ fontSize: W > 1 || H > 1 ? 18 : 14, pointerEvents: 'none' }}>{getPlantEmoji(plant.plantType)}</span>
              {(W > 1 || H > 1) && (
                <span style={{ fontSize: 8, color: color + 'aa', lineHeight: 1, marginTop: 1, pointerEvents: 'none' }}>{W}×{H}</span>
              )}
            </>
        }

        {/* Cooldown overlay: fills bottom-to-top, masked to plant image shape */}
        {isCombatActive && plant.triggerType === 'periodic' && plant.cooldownMs > 0n && (
          <div
            key={plant.triggerCount}
            style={{
              position: 'absolute', inset: 0,
              background: 'rgba(5, 0, 25, 0.52)',
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
