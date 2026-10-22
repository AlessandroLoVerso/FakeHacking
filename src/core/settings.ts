// Impostazioni salvate in locale (localStorage). Se il salvataggio non funziona,
// l'app parte comunque con i valori predefiniti.
import { bus } from './bus';
import { DEFAULT_DEVICES, DEVICE_TYPES, type DeviceConfig } from '../data/devices';

export type Theme = 'dark' | 'green' | 'red';

export interface Settings {
  hackerName: string;
  theme: Theme;
  typingSpeed: number;
  sound: boolean;
  volume: number;
  crt: boolean;
  boot: boolean;
  notifications: boolean;
  devices: DeviceConfig[];
}

const KEY = 'fakehacking.settings.v1';

export function defaultSettings(): Settings {
  return {
    hackerName: 'Ale',
    theme: 'dark',
    typingSpeed: 5,
    sound: true,
    volume: 60,
    crt: false,
    boot: true,
    notifications: true,
    devices: DEFAULT_DEVICES.map((d) => ({ ...d })),
  };
}

function sanitize(raw: unknown): Settings {
  const base = defaultSettings();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<Settings>;
  const num = (v: unknown, min: number, max: number, def: number) =>
    typeof v === 'number' && v >= min && v <= max ? v : def;
  const bool = (v: unknown, def: boolean) => (typeof v === 'boolean' ? v : def);
  const devices = Array.isArray(r.devices)
    ? r.devices
        .filter(
          (d): d is DeviceConfig =>
            !!d && typeof d.id === 'string' && typeof d.name === 'string' && d.type in DEVICE_TYPES,
        )
        .map((d) => ({ id: d.id, name: d.name.slice(0, 40), type: d.type }))
    : base.devices;
  return {
    hackerName:
      typeof r.hackerName === 'string' && r.hackerName.trim()
        ? r.hackerName.trim().slice(0, 24)
        : base.hackerName,
    theme: r.theme === 'green' || r.theme === 'red' || r.theme === 'dark' ? r.theme : base.theme,
    typingSpeed: num(r.typingSpeed, 1, 10, base.typingSpeed),
    sound: bool(r.sound, base.sound),
    volume: num(r.volume, 0, 100, base.volume),
    crt: bool(r.crt, base.crt),
    boot: bool(r.boot, base.boot),
    notifications: bool(r.notifications, base.notifications),
    devices,
  };
}

function load(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    return sanitize(raw ? JSON.parse(raw) : null);
  } catch {
    return defaultSettings();
  }
}

let current = load();

export const getSettings = (): Settings => current;

export function updateSettings(patch: Partial<Settings>) {
  current = sanitize({ ...current, ...patch });
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    // Salvataggio non disponibile: le modifiche valgono solo fino alla chiusura.
  }
  bus.emit('settings', current);
}

export function resetSettings() {
  updateSettings(defaultSettings());
}

/** Nome utente per il prompt della console: minuscolo, senza spazi. */
export function promptUser(): string {
  return (
    current.hackerName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[^a-z0-9]/g, '') || 'hacker'
  );
}
