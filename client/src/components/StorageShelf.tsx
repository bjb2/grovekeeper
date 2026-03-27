import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { useDraggable, useDroppable, useDndContext } from '@dnd-kit/core';
import type { Inventory } from '../module_bindings/types';
import { CONTAINERS, PLANTS } from '../game/data';
import { Tooltip } from './Tooltip';
import { PlantTooltipContent, ContainerTooltipContent } from './ShopView';

const CELL = 44;
export const STASH_W = 560;
const STASH_W_MOBILE = 340;
export const STASH_H = 200;
const STASH_H_MOBILE = 140;
const PADDING = 14;

interface ItemPos { x: number; y: number; rot: number; w: number; h: number; }

export interface StashHandle {
  repositionItem(id: string, dx: number, dy: number): void;
}

interface Props {
  inventory: Inventory[];
  isDisabled: boolean;
  isMobile?: boolean;
}

export const StorageShelf = forwardRef<StashHandle, Props>(function StorageShelf(
  { inventory, isDisabled, isMobile = false },
  ref,
) {
  const stashW = isMobile ? Math.min(STASH_W_MOBILE, window.innerWidth - 20) : STASH_W;
  const stashH = isMobile ? STASH_H_MOBILE : STASH_H;

  const [positions, setPositions] = useState<Record<string, ItemPos>>({});
  const seenRef = useRef<Set<string>>(new Set());

  useImperativeHandle(ref, () => ({
    repositionItem(id: string, dx: number, dy: number) {
      setPositions(prev => {
        const pos = prev[id];
        if (!pos) return prev;
        const newX = Math.max(PADDING, Math.min(stashW - PADDING - pos.w, pos.x + dx));
        const newY = Math.max(PADDING, Math.min(stashH - PADDING - pos.h, pos.y + dy));
        return { ...prev, [id]: { ...pos, x: newX, y: newY } };
      });
    },
  }));

  // Assign random positions to newly seen items
  useEffect(() => {
    const newPositions: Record<string, ItemPos> = {};
    let changed = false;

    for (const item of inventory) {
      const key = item.id.toString();
      if (!seenRef.current.has(key)) {
        seenRef.current.add(key);
        const def = item.itemCategory === 'container'
          ? CONTAINERS[item.itemType]
          : PLANTS[item.itemType];
        const w = ((def as any)?.width ?? 1) * CELL;
        const h = ((def as any)?.height ?? 1) * CELL;
        const maxX = Math.max(stashW - PADDING * 2 - w, 0);
        const maxY = Math.max(stashH - PADDING * 2 - h, 0);
        newPositions[key] = {
          x: PADDING + Math.random() * maxX,
          y: PADDING + Math.random() * maxY,
          rot: (Math.random() - 0.5) * 18,
          w, h,
        };
        changed = true;
      }
    }

    // Clean up removed items
    const activeKeys = new Set(inventory.map(i => i.id.toString()));
    for (const k of seenRef.current) {
      if (!activeKeys.has(k)) seenRef.current.delete(k);
    }

    if (changed) setPositions(prev => ({ ...prev, ...newPositions }));
  }, [inventory]);

  const { active } = useDndContext();
  const dragKind = (active?.data.current as any)?.kind as string | undefined;
  const isReceivingFromBoard = !isDisabled && (dragKind === 'placed-container' || dragKind === 'placed-plant');
  const isAnyDrag = !isDisabled && !!dragKind;

  // Always enabled so delta-based repositioning works for inventory items too
  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: 'stash',
    disabled: isDisabled,
  });

  const borderColor = isOver && isReceivingFromBoard ? '#4ade80aa'
    : isOver ? '#4ade8044'
    : isReceivingFromBoard ? '#3d6a3d'
    : isAnyDrag ? '#2a4a2a66'
    : '#1e3a1e';

  return (
    // Droppable ref on the outer wrapper — covers label + crate for a larger drop zone
    <div ref={setDropRef} style={{ position: 'relative', flexShrink: 0, padding: isMobile ? '0 8px' : 0 }}>
      {/* Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, paddingLeft: 4 }}>
        <span style={{ fontFamily: 'Cinzel', fontSize: isMobile ? 10 : 11, color: isReceivingFromBoard ? '#4ade80' : '#4a6a4a', letterSpacing: 2, textTransform: 'uppercase', transition: 'color 0.15s' }}>
          🎒 Stash
        </span>
        <span style={{ fontSize: 10, color: '#3a5a3a' }}>
          {isReceivingFromBoard
            ? 'drop here to stash'
            : `${inventory.length} item${inventory.length !== 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Physical crate */}
      <div
        style={{
          position: 'relative',
          width: isMobile ? '100%' : STASH_W,
          maxWidth: stashW,
          height: stashH,
          background: isOver
            ? 'radial-gradient(ellipse at center, #1a3a1a 0%, #0d1f0d 60%, #080f08 100%)'
            : 'radial-gradient(ellipse at center, #111a11 0%, #0a120a 60%, #060e06 100%)',
          border: `2px solid ${borderColor}`,
          borderRadius: 12,
          boxShadow: isOver
            ? 'inset 0 0 30px #4ade8022, 0 4px 20px #00000088'
            : 'inset 0 0 40px #00000066, inset 0 2px 8px #00000044, 0 4px 20px #00000088',
          overflow: 'hidden',
          transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
        }}
      >
        {/* Wood grain lines */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.05,
          backgroundImage: 'repeating-linear-gradient(0deg, #4ade80 0px, transparent 1px, transparent 24px)',
        }} />
        {/* Corner accents */}
        {[
          { top: 6, left: 6, borderTop: '2px solid #2a4a2a', borderLeft: '2px solid #2a4a2a', borderRadius: '2px 0 0 0' },
          { top: 6, right: 6, borderTop: '2px solid #2a4a2a', borderRight: '2px solid #2a4a2a', borderRadius: '0 2px 0 0' },
          { bottom: 6, left: 6, borderBottom: '2px solid #2a4a2a', borderLeft: '2px solid #2a4a2a', borderRadius: '0 0 0 2px' },
          { bottom: 6, right: 6, borderBottom: '2px solid #2a4a2a', borderRight: '2px solid #2a4a2a', borderRadius: '0 0 2px 0' },
        ].map((s, i) => (
          <div key={i} style={{ position: 'absolute', width: 12, height: 12, pointerEvents: 'none', ...s }} />
        ))}

        {/* Empty state */}
        {inventory.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#1e3a1e', fontFamily: 'Crimson Text', fontSize: 14, fontStyle: 'italic', pointerEvents: 'none',
          }}>
            empty stash — buy items from the shop
          </div>
        )}

        {/* Items */}
        {inventory.map(item => {
          const key = item.id.toString();
          const pos = positions[key];
          if (!pos) return null;
          return item.itemCategory === 'container'
            ? <StashContainer key={key} item={item} pos={pos} isDisabled={isDisabled} />
            : <StashPlant key={key} item={item} pos={pos} isDisabled={isDisabled} />;
        })}
      </div>
    </div>
  );
});

// ─── Stash Container Item ──────────────────────────────────────────────────────

function StashContainer({ item, pos, isDisabled }: { item: Inventory; pos: ItemPos; isDisabled: boolean }) {
  const def = CONTAINERS[item.itemType];
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `inventory-container:${item.id.toString()}`,
    disabled: isDisabled,
    data: def ? { kind: 'inventory-container', inventoryId: item.id, containerType: item.itemType, def } : undefined,
  });

  if (!def) return null;

  const inner = (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        width: pos.w, height: pos.h,
        cursor: isDisabled ? 'default' : 'grab',
        opacity: isDragging ? 0.3 : 1,
        userSelect: 'none', touchAction: 'none',
        filter: isDragging ? 'none' : 'drop-shadow(0 3px 10px rgba(0,0,0,0.8))',
      }}
    >
      {def.image
        ? <img src={def.image} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'fill', display: 'block' }} />
        : <span style={{ fontSize: Math.min(pos.w, pos.h) * 0.5 }}>{def.emoji}</span>}
    </div>
  );

  return (
    <div style={{
      position: 'absolute', left: pos.x, top: pos.y,
      transform: `rotate(${pos.rot}deg)`, transformOrigin: 'center center',
      zIndex: isDragging ? 0 : 1,
    }}>
      <div style={{ animation: 'stash-drop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
        <Tooltip content={<ContainerTooltipContent def={def} />}>{inner}</Tooltip>
      </div>
    </div>
  );
}

// ─── Stash Plant Item ──────────────────────────────────────────────────────────

function StashPlant({ item, pos, isDisabled }: { item: Inventory; pos: ItemPos; isDisabled: boolean }) {
  const def = PLANTS[item.itemType];
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({
    id: `inventory-plant:${item.id.toString()}`,
    disabled: isDisabled,
    data: { kind: 'inventory-plant', inventoryId: item.id, plantType: item.itemType },
  });

  const inner = (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        width: pos.w, height: pos.h,
        cursor: isDisabled ? 'default' : 'grab',
        opacity: isDragging ? 0.3 : 1,
        userSelect: 'none', touchAction: 'none',
        filter: isDragging ? 'none' : 'drop-shadow(0 3px 10px rgba(0,0,0,0.8))',
      }}
    >
      {def?.image
        ? <img src={def.image} draggable={false} style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
        : <span style={{ fontSize: Math.min(pos.w, pos.h) * 0.5 }}>{def?.emoji ?? '🌱'}</span>}
    </div>
  );

  const wrapper = (
    <div style={{
      position: 'absolute', left: pos.x, top: pos.y,
      transform: `rotate(${pos.rot}deg)`, transformOrigin: 'center center',
      zIndex: isDragging ? 0 : 1,
    }}>
      <div style={{ animation: 'stash-drop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}>
        {def
          ? <Tooltip content={<PlantTooltipContent def={def} />}>{inner}</Tooltip>
          : inner}
      </div>
    </div>
  );

  return wrapper;
}
