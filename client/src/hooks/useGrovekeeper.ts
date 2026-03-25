import { useEffect, useRef, useState, useCallback } from 'react';
import {
  client,
  type Player,
  type ContainerOnBoard,
  type PlantInContainer,
  type CombatState,
  type CombatLogEntry,
  type ShopOffer,
} from '../module_bindings';

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
    };

    client.connect(SPACETIME_HOST, SPACETIME_MODULE, savedToken);

    return () => {
      client.disconnect();
    };
  }, []);

  const placeContainer = useCallback((type: string, x: number, y: number) => {
    client.placeContainer(type, x, y);
  }, []);

  const removeContainer = useCallback((id: bigint) => {
    client.removeContainer(id);
  }, []);

  const placePlant = useCallback((plantType: string, containerId: bigint, slotIndex: number) => {
    client.placePlant(plantType, containerId, slotIndex);
  }, []);

  const removePlant = useCallback((id: bigint) => {
    client.removePlant(id);
  }, []);

  const startCombat = useCallback(() => {
    client.startCombat();
  }, []);

  const buyItem = useCallback((offerId: bigint) => {
    client.buyItem(offerId);
  }, []);

  const finishShopping = useCallback(() => {
    client.finishShopping();
  }, []);

  const resetRun = useCallback(() => {
    client.resetRun();
  }, []);

  return {
    connected,
    error,
    player,
    containers,
    plants,
    combat,
    combatLog,
    shopOffers,
    placeContainer,
    removeContainer,
    placePlant,
    removePlant,
    startCombat,
    buyItem,
    finishShopping,
    resetRun,
  };
}
