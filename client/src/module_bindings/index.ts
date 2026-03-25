/**
 * Grovekeeper SpacetimeDB module bindings.
 * These mimic what `spacetime generate --lang typescript` would produce.
 */

import {
  AlgebraicType,
  BinaryWriter,
  DbConnectionBuilder,
  DbConnectionImpl,
  Identity,
  ProductTypeElement,
  TableCache,
  type EventContextInterface,
  type SubscriptionEventContextInterface,
} from '@clockworklabs/spacetimedb-sdk';

export { Identity };

// ─── ROW TYPES ───────────────────────────────────────────────────────────────

export interface Player {
  identity: Identity;
  hp: number;
  maxHp: number;
  currency: number;
  phase: string;
  round: number;
}

export interface ContainerOnBoard {
  id: bigint;
  owner: Identity;
  containerType: string;
  x: number;
  y: number;
  width: number;
  height: number;
  capacity: number;
  soilType: string;
  affinity: string;
}

export interface PlantInContainer {
  id: bigint;
  owner: Identity;
  plantType: string;
  containerId: bigint;
  slotIndex: number;
  element: string;
  power: number;
}

export interface CombatState {
  owner: Identity;
  enemyName: string;
  enemyHp: number;
  enemyMaxHp: number;
  enemyAttack: number;
  tick: number;
  status: string;
}

export interface CombatLogEntry {
  id: bigint;
  owner: Identity;
  tick: number;
  message: string;
  entryType: string;
}

export interface ShopOffer {
  id: bigint;
  owner: Identity;
  itemCategory: string;
  itemType: string;
  cost: number;
  purchased: boolean;
}

// ─── ALGEBRAIC TYPE DEFINITIONS ─────────────────────────────────────────────

const elem = (name: string, t: AlgebraicType) => new ProductTypeElement(name, t);
const I32 = () => AlgebraicType.createI32Type();
const U64 = () => AlgebraicType.createU64Type();
const Str = () => AlgebraicType.createStringType();
const Bool = () => AlgebraicType.createBoolType();
const Id = () => AlgebraicType.createIdentityType();

const playerType = AlgebraicType.createProductType([
  elem('identity', Id()),
  elem('hp', I32()),
  elem('max_hp', I32()),
  elem('currency', I32()),
  elem('phase', Str()),
  elem('round', I32()),
]);

const containerType = AlgebraicType.createProductType([
  elem('id', U64()),
  elem('owner', Id()),
  elem('container_type', Str()),
  elem('x', I32()),
  elem('y', I32()),
  elem('width', I32()),
  elem('height', I32()),
  elem('capacity', I32()),
  elem('soil_type', Str()),
  elem('affinity', Str()),
]);

const plantType = AlgebraicType.createProductType([
  elem('id', U64()),
  elem('owner', Id()),
  elem('plant_type', Str()),
  elem('container_id', U64()),
  elem('slot_index', I32()),
  elem('element', Str()),
  elem('power', I32()),
]);

const combatStateType = AlgebraicType.createProductType([
  elem('owner', Id()),
  elem('enemy_name', Str()),
  elem('enemy_hp', I32()),
  elem('enemy_max_hp', I32()),
  elem('enemy_attack', I32()),
  elem('tick', I32()),
  elem('status', Str()),
]);

const combatLogType = AlgebraicType.createProductType([
  elem('id', U64()),
  elem('owner', Id()),
  elem('tick', I32()),
  elem('message', Str()),
  elem('entry_type', Str()),
]);

const shopOfferType = AlgebraicType.createProductType([
  elem('id', U64()),
  elem('owner', Id()),
  elem('item_category', Str()),
  elem('item_type', Str()),
  elem('cost', I32()),
  elem('purchased', Bool()),
]);

// ─── ROW MAPPERS ─────────────────────────────────────────────────────────────
// The SDK deserializes product type fields using the exact field names
// defined in AlgebraicType. Identity fields come back as { __identity__: bigint }.

function toIdentity(raw: any): Identity {
  if (raw instanceof Identity) return raw;
  if (typeof raw === 'object' && '__identity__' in raw) return new Identity(raw.__identity__);
  return new Identity(raw);
}

function mapPlayer(r: any): Player {
  return {
    identity: toIdentity(r.identity),
    hp: Number(r.hp),
    maxHp: Number(r.max_hp),
    currency: Number(r.currency),
    phase: String(r.phase),
    round: Number(r.round),
  };
}

function mapContainer(r: any): ContainerOnBoard {
  return {
    id: BigInt(r.id),
    owner: toIdentity(r.owner),
    containerType: String(r.container_type),
    x: Number(r.x),
    y: Number(r.y),
    width: Number(r.width),
    height: Number(r.height),
    capacity: Number(r.capacity),
    soilType: String(r.soil_type),
    affinity: String(r.affinity),
  };
}

function mapPlant(r: any): PlantInContainer {
  return {
    id: BigInt(r.id),
    owner: toIdentity(r.owner),
    plantType: String(r.plant_type),
    containerId: BigInt(r.container_id),
    slotIndex: Number(r.slot_index),
    element: String(r.element),
    power: Number(r.power),
  };
}

function mapCombatState(r: any): CombatState {
  return {
    owner: toIdentity(r.owner),
    enemyName: String(r.enemy_name),
    enemyHp: Number(r.enemy_hp),
    enemyMaxHp: Number(r.enemy_max_hp),
    enemyAttack: Number(r.enemy_attack),
    tick: Number(r.tick),
    status: String(r.status),
  };
}

function mapCombatLog(r: any): CombatLogEntry {
  return {
    id: BigInt(r.id),
    owner: toIdentity(r.owner),
    tick: Number(r.tick),
    message: String(r.message),
    entryType: String(r.entry_type),
  };
}

function mapShopOffer(r: any): ShopOffer {
  return {
    id: BigInt(r.id),
    owner: toIdentity(r.owner),
    itemCategory: String(r.item_category),
    itemType: String(r.item_type),
    cost: Number(r.cost),
    purchased: Boolean(r.purchased),
  };
}

// ─── TABLE HANDLE ─────────────────────────────────────────────────────────────

class TableHandle<Raw, Mapped> {
  private cache: TableCache<Raw>;
  private mapper: (r: Raw) => Mapped;

  constructor(cache: TableCache<Raw>, mapper: (r: Raw) => Mapped) {
    this.cache = cache;
    this.mapper = mapper;
  }

  iter(): Mapped[] {
    return this.cache.iter().map(this.mapper);
  }

  onInsert(cb: (ctx: any, row: Mapped) => void) {
    this.cache.onInsert((ctx: any, raw: Raw) => cb(ctx, this.mapper(raw)));
  }
  onUpdate(cb: (ctx: any, oldRow: Mapped, row: Mapped) => void) {
    this.cache.onUpdate((ctx: any, old: Raw, row: Raw) =>
      cb(ctx, this.mapper(old), this.mapper(row))
    );
  }
  onDelete(cb: (ctx: any, row: Mapped) => void) {
    this.cache.onDelete((ctx: any, raw: Raw) => cb(ctx, this.mapper(raw)));
  }
}

// ─── DB VIEW ─────────────────────────────────────────────────────────────────

class DbView {
  player: TableHandle<any, Player>;
  containerOnBoard: TableHandle<any, ContainerOnBoard>;
  plantInContainer: TableHandle<any, PlantInContainer>;
  combatState: TableHandle<any, CombatState>;
  combatLogEntry: TableHandle<any, CombatLogEntry>;
  shopOffer: TableHandle<any, ShopOffer>;

  constructor(conn: DbConnectionImpl) {
    const cache = (conn as any).clientCache;
    this.player = new TableHandle(
      cache.getOrCreateTable({ tableName: 'player', rowType: playerType, primaryKeyInfo: { colName: 'identity', colType: Id() } }),
      mapPlayer
    );
    this.containerOnBoard = new TableHandle(
      cache.getOrCreateTable({ tableName: 'container_on_board', rowType: containerType, primaryKeyInfo: { colName: 'id', colType: U64() } }),
      mapContainer
    );
    this.plantInContainer = new TableHandle(
      cache.getOrCreateTable({ tableName: 'plant_in_container', rowType: plantType, primaryKeyInfo: { colName: 'id', colType: U64() } }),
      mapPlant
    );
    this.combatState = new TableHandle(
      cache.getOrCreateTable({ tableName: 'combat_state', rowType: combatStateType, primaryKeyInfo: { colName: 'owner', colType: Id() } }),
      mapCombatState
    );
    this.combatLogEntry = new TableHandle(
      cache.getOrCreateTable({ tableName: 'combat_log_entry', rowType: combatLogType, primaryKeyInfo: { colName: 'id', colType: U64() } }),
      mapCombatLog
    );
    this.shopOffer = new TableHandle(
      cache.getOrCreateTable({ tableName: 'shop_offer', rowType: shopOfferType, primaryKeyInfo: { colName: 'id', colType: U64() } }),
      mapShopOffer
    );
  }
}

// ─── REDUCER SERIALIZATION ───────────────────────────────────────────────────

function writeString(w: BinaryWriter, s: string) { Str().serialize(w, s); }
function writeI32(w: BinaryWriter, v: number) { I32().serialize(w, v); }
function writeU64(w: BinaryWriter, v: bigint) { U64().serialize(w, v); }
function writeBool(w: BinaryWriter, v: boolean) { Bool().serialize(w, v); }

// ─── REDUCERS ─────────────────────────────────────────────────────────────────

class Reducers {
  private conn: DbConnectionImpl;

  constructor(conn: DbConnectionImpl) { this.conn = conn; }

  private call(name: string, write: (w: BinaryWriter) => void) {
    const w = new BinaryWriter(256);
    write(w);
    this.conn.callReducer(name, w.getBuffer(), 0 as any);
  }

  placeContainer(containerType: string, x: number, y: number) {
    this.call('place_container', w => { writeString(w, containerType); writeI32(w, x); writeI32(w, y); });
  }
  removeContainer(id: bigint) {
    this.call('remove_container', w => writeU64(w, id));
  }
  placePlant(plantType: string, containerId: bigint, slotIndex: number) {
    this.call('place_plant', w => { writeString(w, plantType); writeU64(w, containerId); writeI32(w, slotIndex); });
  }
  removePlant(id: bigint) {
    this.call('remove_plant', w => writeU64(w, id));
  }
  startCombat() {
    this.call('start_combat', () => {});
  }
  buyItem(offerId: bigint) {
    this.call('buy_item', w => writeU64(w, offerId));
  }
  finishShopping() {
    this.call('finish_shopping', () => {});
  }
  resetRun() {
    this.call('reset_run', () => {});
  }
}

// ─── REMOTE MODULE ────────────────────────────────────────────────────────────

const REMOTE_MODULE = {
  tables: {
    player:             { tableName: 'player',              rowType: playerType,      primaryKeyInfo: { colName: 'identity',  colType: Id()  } },
    container_on_board: { tableName: 'container_on_board',  rowType: containerType,   primaryKeyInfo: { colName: 'id',        colType: U64() } },
    plant_in_container: { tableName: 'plant_in_container',  rowType: plantType,       primaryKeyInfo: { colName: 'id',        colType: U64() } },
    combat_state:       { tableName: 'combat_state',        rowType: combatStateType, primaryKeyInfo: { colName: 'owner',     colType: Id()  } },
    combat_log_entry:   { tableName: 'combat_log_entry',    rowType: combatLogType,   primaryKeyInfo: { colName: 'id',        colType: U64() } },
    shop_offer:         { tableName: 'shop_offer',          rowType: shopOfferType,   primaryKeyInfo: { colName: 'id',        colType: U64() } },
  },
  reducers: {
    place_container:  { reducerName: 'place_container',  argsType: AlgebraicType.createProductType([elem('container_type', Str()), elem('x', I32()), elem('y', I32())]) },
    remove_container: { reducerName: 'remove_container', argsType: AlgebraicType.createProductType([elem('id', U64())]) },
    place_plant:      { reducerName: 'place_plant',      argsType: AlgebraicType.createProductType([elem('plant_type', Str()), elem('container_id', U64()), elem('slot_index', I32())]) },
    remove_plant:     { reducerName: 'remove_plant',     argsType: AlgebraicType.createProductType([elem('id', U64())]) },
    start_combat:     { reducerName: 'start_combat',     argsType: AlgebraicType.createProductType([]) },
    buy_item:         { reducerName: 'buy_item',         argsType: AlgebraicType.createProductType([elem('offer_id', U64())]) },
    finish_shopping:  { reducerName: 'finish_shopping',  argsType: AlgebraicType.createProductType([]) },
    reset_run:        { reducerName: 'reset_run',        argsType: AlgebraicType.createProductType([]) },
  },
  eventContextConstructor: (imp: DbConnectionImpl, event: any) => ({ conn: imp, event }),
  dbViewConstructor: (conn: DbConnectionImpl) => new DbView(conn),
  reducersConstructor: (conn: DbConnectionImpl) => new Reducers(conn),
  setReducerFlagsConstructor: () => ({}),
};

// ─── DB CONNECTION ────────────────────────────────────────────────────────────

export type EventContext = EventContextInterface<DbView, Reducers>;
export type SubscriptionEventContext = SubscriptionEventContextInterface<DbView, Reducers>;

export type DbConnection = DbConnectionImpl<DbView, Reducers>;

export const DbConnection = {
  builder(): DbConnectionBuilder<DbConnectionImpl<DbView, Reducers>, any, any> {
    return new DbConnectionBuilder<DbConnectionImpl<DbView, Reducers>, any, any>(
      REMOTE_MODULE as any,
      (imp: DbConnectionImpl) => imp as DbConnectionImpl<DbView, Reducers>
    );
  },
};

// ─── CONVENIENCE CLIENT ───────────────────────────────────────────────────────
// A simpler stateful wrapper used by the React hook.

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
};

export class GroveKeeperClient {
  private conn: DbConnectionImpl<DbView, Reducers> | null = null;
  private _identity: Identity | null = null;
  callbacks: ConnectionCallbacks & TableCallbacks = {};

  connect(host: string, moduleName: string, token?: string) {
    const builder = DbConnection.builder()
      .withUri(host)
      .withModuleName(moduleName)
      .onConnect((conn: DbConnectionImpl<DbView, Reducers>, id: Identity, tok: string) => {
        this.conn = conn;
        this._identity = id;
        this.callbacks.onConnect?.(id, tok);
        this._registerTableCallbacks(conn);
        conn.subscriptionBuilder()
          .onApplied((_ctx: any) => {
            this._fireAllCallbacks();
          })
          .subscribe([
            'SELECT * FROM player',
            'SELECT * FROM container_on_board',
            'SELECT * FROM plant_in_container',
            'SELECT * FROM combat_state',
            'SELECT * FROM combat_log_entry',
            'SELECT * FROM shop_offer',
          ]);
      })
      .onDisconnect(() => this.callbacks.onDisconnect?.())
      .onConnectError((_conn: any, err: Error) => this.callbacks.onError?.(err));

    if (token) builder.withToken(token);
    builder.build();
  }

  private _registerTableCallbacks(conn: DbConnectionImpl<DbView, Reducers>) {
    const id = this._identity;
    const myHex = () => id?.toHexString() ?? '';

    conn.db.player.onInsert((_ctx: any, p: Player) => {
      if (p.identity.toHexString() === myHex()) this.callbacks.onPlayer?.(p);
    });
    conn.db.player.onUpdate((_ctx: any, _old: Player, p: Player) => {
      if (p.identity.toHexString() === myHex()) this.callbacks.onPlayer?.(p);
    });

    conn.db.containerOnBoard.onInsert((_ctx: any, _c: ContainerOnBoard) => this.callbacks.onContainersChange?.());
    conn.db.containerOnBoard.onUpdate((_ctx: any, _o: ContainerOnBoard, _c: ContainerOnBoard) => this.callbacks.onContainersChange?.());
    conn.db.containerOnBoard.onDelete((_ctx: any, _c: ContainerOnBoard) => this.callbacks.onContainersChange?.());

    conn.db.plantInContainer.onInsert((_ctx: any, _p: PlantInContainer) => this.callbacks.onPlantsChange?.());
    conn.db.plantInContainer.onUpdate((_ctx: any, _o: PlantInContainer, _p: PlantInContainer) => this.callbacks.onPlantsChange?.());
    conn.db.plantInContainer.onDelete((_ctx: any, _p: PlantInContainer) => this.callbacks.onPlantsChange?.());

    conn.db.combatState.onInsert((_ctx: any, _s: CombatState) => this.callbacks.onCombatChange?.(this.myCombat()));
    conn.db.combatState.onUpdate((_ctx: any, _o: CombatState, _s: CombatState) => this.callbacks.onCombatChange?.(this.myCombat()));
    conn.db.combatState.onDelete((_ctx: any, _s: CombatState) => this.callbacks.onCombatChange?.(null));

    conn.db.combatLogEntry.onInsert((_ctx: any, _e: CombatLogEntry) => this.callbacks.onCombatLog?.(this.myCombatLog()));
    conn.db.combatLogEntry.onDelete((_ctx: any, _e: CombatLogEntry) => this.callbacks.onCombatLog?.(this.myCombatLog()));

    conn.db.shopOffer.onInsert((_ctx: any, _o: ShopOffer) => this.callbacks.onShopChange?.(this.myShopOffers()));
    conn.db.shopOffer.onUpdate((_ctx: any, _x: ShopOffer, _o: ShopOffer) => this.callbacks.onShopChange?.(this.myShopOffers()));
    conn.db.shopOffer.onDelete((_ctx: any, _o: ShopOffer) => this.callbacks.onShopChange?.(this.myShopOffers()));
  }

  private _fireAllCallbacks() {
    const p = this.myPlayer();
    if (p) this.callbacks.onPlayer?.(p);
    this.callbacks.onContainersChange?.();
    this.callbacks.onPlantsChange?.();
    this.callbacks.onCombatChange?.(this.myCombat());
    this.callbacks.onCombatLog?.(this.myCombatLog());
    this.callbacks.onShopChange?.(this.myShopOffers());
  }

  getIdentity() { return this._identity; }

  myPlayer(): Player | null {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return null;
    return this.conn.db.player.iter().find(p => p.identity.toHexString() === hex) ?? null;
  }

  myContainers(): ContainerOnBoard[] {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return [];
    return this.conn.db.containerOnBoard.iter().filter(c => c.owner.toHexString() === hex);
  }

  myPlants(): PlantInContainer[] {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return [];
    return this.conn.db.plantInContainer.iter().filter(p => p.owner.toHexString() === hex);
  }

  myCombat(): CombatState | null {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return null;
    return this.conn.db.combatState.iter().find(c => c.owner.toHexString() === hex) ?? null;
  }

  myCombatLog(): CombatLogEntry[] {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return [];
    return this.conn.db.combatLogEntry.iter()
      .filter(e => e.owner.toHexString() === hex)
      .sort((a, b) => Number(a.id) - Number(b.id));
  }

  myShopOffers(): ShopOffer[] {
    const hex = this._identity?.toHexString();
    if (!hex || !this.conn) return [];
    return this.conn.db.shopOffer.iter().filter(o => o.owner.toHexString() === hex);
  }

  // Reducers
  placeContainer(t: string, x: number, y: number) { this.conn?.reducers.placeContainer(t, x, y); }
  removeContainer(id: bigint) { this.conn?.reducers.removeContainer(id); }
  placePlant(t: string, cid: bigint, slot: number) { this.conn?.reducers.placePlant(t, cid, slot); }
  removePlant(id: bigint) { this.conn?.reducers.removePlant(id); }
  startCombat() { this.conn?.reducers.startCombat(); }
  buyItem(id: bigint) { this.conn?.reducers.buyItem(id); }
  finishShopping() { this.conn?.reducers.finishShopping(); }
  resetRun() { this.conn?.reducers.resetRun(); }
  disconnect() { this.conn?.disconnect(); }
}

export const client = new GroveKeeperClient();
