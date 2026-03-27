import { type Identity } from 'spacetimedb';
import { DbConnection } from './index';
import type {
  Player,
  ContainerOnBoard,
  PlantInContainer,
  CombatState,
  CombatLogEntry,
  ShopOffer,
  Inventory,
  ActiveEffect,
} from './types';

// Re-export row types so consumers can import from here
export type { Player, ContainerOnBoard, PlantInContainer, CombatState, CombatLogEntry, ShopOffer, Inventory, ActiveEffect };

// ─── CONVENIENCE CLIENT ───────────────────────────────────────────────────────
// Lives here (not in index.ts) so `npm run generate` doesn't overwrite it.

export type ConnectionCallbacks = {
  onConnect?: (identity: Identity, token: string) => void;
  onDisconnect?: () => void;
  onError?: (err: Error) => void;
};

export type TableCallbacks = {
  onPlayer?: (p: Player) => void;
  onContainersChange?: () => void;
  onPlantsChange?: () => void;
  onCombatChange?: (c: CombatState | null) => void;
  onCombatLog?: (log: CombatLogEntry[]) => void;
  onShopChange?: (offers: ShopOffer[]) => void;
  onInventoryChange?: (items: Inventory[]) => void;
  onActiveEffectsChange?: (effects: ActiveEffect[]) => void;
};

export class GroveKeeperClient {
  private conn: DbConnection | null = null;
  private _identity: Identity | null = null;
  callbacks: ConnectionCallbacks & TableCallbacks = {};

  connect(host: string, databaseName: string, token?: string) {
    const builder = DbConnection.builder()
      .withUri(host)
      .withDatabaseName(databaseName)
      .onConnect((conn: DbConnection, id: Identity, tok: string) => {
        this.conn = conn;
        this._identity = id;
        this.callbacks.onConnect?.(id, tok);
        this._registerTableCallbacks(conn);
        conn.subscriptionBuilder()
          .onApplied(() => {
            this._fireAllCallbacks();
          })
          .subscribe([
            'SELECT * FROM player',
            'SELECT * FROM container_on_board',
            'SELECT * FROM plant_in_container',
            'SELECT * FROM combat_state',
            'SELECT * FROM combat_log_entry',
            'SELECT * FROM shop_offer',
            'SELECT * FROM inventory',
            'SELECT * FROM active_effect',
          ]);
      })
      .onDisconnect((_ctx, err) => {
        this.callbacks.onDisconnect?.();
        if (err) this.callbacks.onError?.(err);
      })
      .onConnectError((_ctx, err) => this.callbacks.onError?.(err));

    if (token) builder.withToken(token);
    builder.build();
  }

  private _registerTableCallbacks(conn: DbConnection) {
    const id = this._identity;
    const myHex = () => id?.toHexString() ?? '';

    conn.db.player.onInsert((_ctx, p) => {
      if (p.identity.toHexString() === myHex()) this.callbacks.onPlayer?.(p);
    });
    conn.db.player.onUpdate((_ctx, _old, p) => {
      if (p.identity.toHexString() === myHex()) this.callbacks.onPlayer?.(p);
    });

    conn.db.container_on_board.onInsert(() => this.callbacks.onContainersChange?.());
    conn.db.container_on_board.onUpdate(() => this.callbacks.onContainersChange?.());
    conn.db.container_on_board.onDelete(() => this.callbacks.onContainersChange?.());

    conn.db.plant_in_container.onInsert(() => this.callbacks.onPlantsChange?.());
    conn.db.plant_in_container.onUpdate(() => this.callbacks.onPlantsChange?.());
    conn.db.plant_in_container.onDelete(() => this.callbacks.onPlantsChange?.());

    conn.db.combat_state.onInsert(() => this.callbacks.onCombatChange?.(this.myCombat()));
    conn.db.combat_state.onUpdate(() => this.callbacks.onCombatChange?.(this.myCombat()));
    conn.db.combat_state.onDelete(() => this.callbacks.onCombatChange?.(null));

    conn.db.combat_log_entry.onInsert(() => this.callbacks.onCombatLog?.(this.myCombatLog()));
    conn.db.combat_log_entry.onDelete(() => this.callbacks.onCombatLog?.(this.myCombatLog()));

    conn.db.shop_offer.onInsert(() => this.callbacks.onShopChange?.(this.myShopOffers()));
    conn.db.shop_offer.onUpdate(() => this.callbacks.onShopChange?.(this.myShopOffers()));
    conn.db.shop_offer.onDelete(() => this.callbacks.onShopChange?.(this.myShopOffers()));

    conn.db.inventory.onInsert(() => this.callbacks.onInventoryChange?.(this.myInventory()));
    conn.db.inventory.onDelete(() => this.callbacks.onInventoryChange?.(this.myInventory()));

    conn.db.active_effect.onInsert(() => this.callbacks.onActiveEffectsChange?.(this.myActiveEffects()));
    conn.db.active_effect.onUpdate(() => this.callbacks.onActiveEffectsChange?.(this.myActiveEffects()));
    conn.db.active_effect.onDelete(() => this.callbacks.onActiveEffectsChange?.(this.myActiveEffects()));
  }

  private _fireAllCallbacks() {
    const p = this.myPlayer();
    if (p) this.callbacks.onPlayer?.(p);
    this.callbacks.onContainersChange?.();
    this.callbacks.onPlantsChange?.();
    this.callbacks.onCombatChange?.(this.myCombat());
    this.callbacks.onCombatLog?.(this.myCombatLog());
    this.callbacks.onShopChange?.(this.myShopOffers());
    this.callbacks.onInventoryChange?.(this.myInventory());
    this.callbacks.onActiveEffectsChange?.(this.myActiveEffects());
  }

  getIdentity() { return this._identity; }

  myPlayer(): Player | null {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return null;
    return [...this.conn.db.player.iter()].find(p => p.identity.toHexString() === hex) ?? null;
  }

  myContainers(): ContainerOnBoard[] {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return [];
    return [...this.conn.db.container_on_board.iter()].filter(c => c.owner.toHexString() === hex);
  }

  myPlants(): PlantInContainer[] {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return [];
    return [...this.conn.db.plant_in_container.iter()].filter(p => p.owner.toHexString() === hex);
  }

  myCombat(): CombatState | null {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return null;
    return [...this.conn.db.combat_state.iter()].find(c => c.owner.toHexString() === hex) ?? null;
  }

  myCombatLog(): CombatLogEntry[] {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return [];
    return [...this.conn.db.combat_log_entry.iter()]
      .filter(e => e.owner.toHexString() === hex)
      .sort((a, b) => Number(a.id) - Number(b.id));
  }

  myShopOffers(): ShopOffer[] {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return [];
    return [...this.conn.db.shop_offer.iter()].filter(o => o.owner.toHexString() === hex);
  }

  myInventory(): Inventory[] {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return [];
    return [...this.conn.db.inventory.iter()].filter(i => i.owner.toHexString() === hex);
  }

  myActiveEffects(): ActiveEffect[] {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return [];
    return [...this.conn.db.active_effect.iter()].filter(e => e.owner.toHexString() === hex);
  }

  // Reducers
  placeContainer(containerType: string, x: number, y: number) {
    this.conn?.reducers.placeContainer({ containerType, x, y });
  }
  moveContainer(containerId: bigint, x: number, y: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.conn?.reducers as any)?.moveContainer({ containerId, x, y });
  }
  removeContainer(containerId: bigint) {
    this.conn?.reducers.removeContainer({ containerId });
  }
  placePlant(plantType: string, boardX: number, boardY: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.conn?.reducers as any)?.placePlant({ plantType, boardX, boardY });
  }
  removePlant(plantId: bigint) {
    this.conn?.reducers.removePlant({ plantId });
  }
  placeFromInventory(inventoryId: bigint, x: number, y: number) {
    this.conn?.reducers.placeFromInventory({ inventoryId, x, y });
  }
  placePlantFromInventory(inventoryId: bigint, boardX: number, boardY: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.conn?.reducers as any)?.placePlantFromInventory({ inventoryId, boardX, boardY });
  }
  movePlant(plantId: bigint, boardX: number, boardY: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (this.conn?.reducers as any)?.movePlant({ plantId, boardX, boardY });
  }
  startCombat() { this.conn?.reducers.startCombat({}); }
  returnToGrove() { this.conn?.reducers.returnToGrove({}); }
  rerollShop() { this.conn?.reducers.rerollShop({}); }
  buyItem(offerId: bigint) { this.conn?.reducers.buyItem({ offerId }); }
  finishShopping() { this.conn?.reducers.finishShopping({}); }
  resetRun() { this.conn?.reducers.resetRun({}); }
  disconnect() { this.conn?.disconnect(); }
}

export const client = new GroveKeeperClient();
