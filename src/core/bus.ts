// Bus di eventi tipizzato: i pannelli si parlano senza conoscersi.
import type { Settings } from './settings';

export type MissionId =
  | 'phone'
  | 'trace'
  | 'decrypt'
  | 'download'
  | 'firewall'
  | 'matrix'
  | 'nuke'
  | 'scan';

interface Events {
  /** Quanto è "agitata" la scena: fa correre log e grafici. */
  pulse: number;
  points: number;
  mission: MissionId;
  settings: Settings;
  autopilot: boolean;
  focus: 'editor' | 'console';
  cursor: { line: number; col: number; lang: string };
}

type Handler<T> = (payload: T) => void;
const handlers = new Map<keyof Events, Set<Handler<never>>>();

export const bus = {
  on<K extends keyof Events>(event: K, fn: Handler<Events[K]>) {
    if (!handlers.has(event)) handlers.set(event, new Set());
    handlers.get(event)!.add(fn as Handler<never>);
  },
  emit<K extends keyof Events>(event: K, payload: Events[K]) {
    handlers.get(event)?.forEach((fn) => (fn as Handler<Events[K]>)(payload));
  },
};
