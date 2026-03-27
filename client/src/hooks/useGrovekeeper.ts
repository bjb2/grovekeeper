import { useEffect, useRef, useState, useCallback } from 'react';
import { client } from '../module_bindings/client';
import type {
  Player,
  ContainerOnBoard,
  PlantInContainer,
  CombatState,
  CombatLogEntry,
  ShopOffer,
  Inventory,
  ActiveEffect,
} from '../module_bindings/types';

const SPACETIME_HOST = import.meta.env.VITE_SPACETIME_HOST ?? 'wss://maincloud.spacetimedb.com';
const SPACETIME_MODULE = import.meta.env.VITE_SPACETIME_MODULE ?? 'grovekeeper';

export function useGrovekeeper() {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [player, setPlayer] = useState<Player | null>(null);
  const [containers, setContainers] = useState<ContainerOnBoard[]>([]);
  const [plants, setPlants] = useState<PlantInContainer[]>([]);
  const [combat, setCombat] = useState<CombatState | null>(null);
  const [combatLog, setCombatLog] = useState<CombatLogEntry[]>([]);
  const [shopOffers, setShopOffers] = useState<ShopOffer[]>([]);
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);

  const tokenKey = 'grovekeeper_token';
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const savedToken = localStorage.getItem(tokenKey) ?? undefined;

    client.callbacks = {
      onConnect: (_id, token) => {
        localStorage.setItem(tokenKey, token);
        setConnected(true);
        setError(null);
      },
      onDisconnect: () => setConnected(false),
      onError: (err) => setError(err.message),
      onPlayer: (p) => setPlayer({ ...p }),
      onContainersChange: () => setContainers(client.myContainers()),
      onPlantsChange: () => setPlants(client.myPlants()),
      onCombatChange: (c) => setCombat(c ? { ...c } : null),
      onCombatLog: (log) => setCombatLog([...log]),
      onShopChange: (offers) => setShopOffers([...offers]),
      onInventoryChange: (items) => setInventory([...items]),
      onActiveEffectsChange: (effects) => setActiveEffects([...effects]),
    };

    client.connect(SPACETIME_HOST, SPACETIME_MODULE, savedToken);

    return () => { client.disconnect(); };
  }, []);

  const placeContainer = useCallback((type: string, x: number, y: number) => {
    client.placeContainer(type, x, y);
  }, []);

  const moveContainer = useCallback((id: bigint, x: number, y: number) => {
    client.moveContainer(id, x, y);
  }, []);

  const removeContainer = useCallback((id: bigint) => {
    client.removeContainer(id);
  }, []);

  const rotateContainer = useCallback((id: bigint) => {
    client.rotateContainer(id);
  }, []);

  const placePlant = useCallback((plantType: string, boardX: number, boardY: number) => {
    client.placePlant(plantType, boardX, boardY);
  }, []);

  const removePlant = useCallback((id: bigint) => {
    client.removePlant(id);
  }, []);

  const placeFromInventory = useCallback((inventoryId: bigint, x: number, y: number) => {
    client.placeFromInventory(inventoryId, x, y);
  }, []);

  const placePlantFromInventory = useCallback((inventoryId: bigint, boardX: number, boardY: number) => {
    client.placePlantFromInventory(inventoryId, boardX, boardY);
  }, []);

  const movePlant = useCallback((plantId: bigint, boardX: number, boardY: number) => {
    client.movePlant(plantId, boardX, boardY);
  }, []);

  const startCombat = useCallback(() => { client.startCombat(); }, []);
  const returnToGrove = useCallback(() => { client.returnToGrove(); }, []);
  const rerollShop = useCallback(() => { client.rerollShop(); }, []);
  const buyItem = useCallback((offerId: bigint) => { client.buyItem(offerId); }, []);
  const finishShopping = useCallback(() => { client.finishShopping(); }, []);
  const resetRun = useCallback(() => { client.resetRun(); }, []);

  return {
    connected, error, player,
    containers, plants, combat, combatLog, shopOffers, inventory, activeEffects,
    placeContainer, moveContainer, removeContainer, rotateContainer, placePlant, removePlant,
    placeFromInventory, placePlantFromInventory, movePlant,
    startCombat, returnToGrove, rerollShop, buyItem, finishShopping, resetRun,
  };
}
