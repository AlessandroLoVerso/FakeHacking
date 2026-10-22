// Interpreta quello che l'utente scrive in console. Funzione pura: niente DOM,
// niente casualità, così si può testare.
import { DEVICE_TYPES, type DeviceConfig } from '../data/devices';
import { normalize } from '../core/util';

export type CommandKind =
  | 'empty'
  | 'help'
  | 'clear'
  | 'whoami'
  | 'ls'
  | 'sudo'
  | 'exit'
  | 'coffee'
  | 'nuke'
  | 'matrix'
  | 'scan'
  | 'decrypt'
  | 'download'
  | 'firewall'
  | 'trace'
  | 'hack'
  | 'custom';

export interface Command {
  kind: CommandKind;
  deviceId?: string;
  raw: string;
}

/** Comandi che valgono solo come prima parola. */
const FIRST_WORD: [CommandKind, string[]][] = [
  ['help', ['help', 'aiuto', 'man', 'comandi', '?', 'h']],
  ['clear', ['clear', 'cls', 'pulisci']],
  ['whoami', ['whoami', 'chisono']],
  ['ls', ['ls', 'dir', 'll']],
  ['sudo', ['sudo', 'su']],
  ['exit', ['exit', 'quit', 'esci', 'logout']],
];

/** Parole chiave che possono stare ovunque nella frase, in ordine di priorità. */
const ANYWHERE: [CommandKind, string[]][] = [
  ['nuke', ['nuke', 'autodistruzione', 'autodistruggi', 'selfdestruct', 'bomba', 'boom', 'apocalisse', 'detona']],
  ['matrix', ['matrix', 'neo', 'pillola', 'morpheus']],
  ['scan', ['scan', 'nmap', 'scansiona', 'scansione', 'scanner', 'radar']],
  ['decrypt', ['decrypt', 'decifra', 'decripta', 'crack', 'password', 'pwd', 'hash', 'bruteforce', 'brute', 'cifrato']],
  ['download', ['download', 'scarica', 'ruba', 'steal', 'wget', 'curl', 'exfiltrate', 'esfiltra', 'ricetta', 'copia']],
  ['firewall', ['firewall', 'bypass', 'sfonda', 'muro', 'breach', 'antivirus', 'proxy']],
  ['trace', ['trace', 'track', 'traccia', 'trova', 'localizza', 'gps', 'dove', 'where', 'locate', 'satellite', 'mappa', 'map', 'segui', 'triangola']],
  ['hack', ['hack', 'hackera', 'pwn', 'exploit', 'attacca', 'attack', 'entra', 'inject', 'root', 'own', 'buca', 'violare', 'viola']],
  ['coffee', ['caffe', 'coffee', 'espresso', 'cappuccino']],
];

/** Parole troppo generiche per identificare un dispositivo. */
const STOPWORDS = new Set(['di', 'del', 'della', 'dello', 'dei', 'degli', 'delle', 'the', 'of', 'iot', 'smart', 'mio', 'mia', 'il', 'la', 'lo']);

function tokenize(text: string): string[] {
  return normalize(text)
    .split(/[^a-z0-9?-]+/)
    .filter(Boolean);
}

/** Trova il dispositivo citato nella frase, se c'è. */
export function findDevice(text: string, devices: readonly DeviceConfig[]): DeviceConfig | undefined {
  const tokens = new Set(tokenize(text));
  const flat = ` ${tokenize(text).join(' ')} `;
  let best: DeviceConfig | undefined;
  let bestScore = 0;
  for (const d of devices) {
    let score = 0;
    const nameTokens = tokenize(d.name).filter((t) => t.length >= 2 && !STOPWORDS.has(t));
    for (const t of nameTokens) if (tokens.has(t)) score += 3;
    if (flat.includes(` ${tokenize(d.name).join(' ')} `)) score += 5;
    for (const w of DEVICE_TYPES[d.type].words) {
      if (flat.includes(` ${normalize(w)} `)) score += 1;
    }
    if (score > bestScore) {
      best = d;
      bestScore = score;
    }
  }
  return best;
}

export function parseCommand(raw: string, devices: readonly DeviceConfig[]): Command {
  const text = raw.trim();
  const tokens = tokenize(text);
  if (tokens.length === 0) return { kind: 'empty', raw: text };

  for (const [kind, words] of FIRST_WORD) {
    if (words.includes(tokens[0])) return { kind, raw: text };
  }

  const device = findDevice(text, devices);
  const withDevice = (kind: CommandKind): Command =>
    device ? { kind, deviceId: device.id, raw: text } : { kind, raw: text };

  for (const [kind, words] of ANYWHERE) {
    if (tokens.some((t) => words.includes(t))) return withDevice(kind);
  }

  if (device) return withDevice('hack');
  return { kind: 'custom', raw: text };
}

/** Parole proposte dal tasto Tab. */
export const COMPLETIONS = [
  'help',
  'hack',
  'trace',
  'decrypt',
  'download',
  'firewall',
  'scan',
  'matrix',
  'nuke',
  'whoami',
  'clear',
  'caffe',
];
