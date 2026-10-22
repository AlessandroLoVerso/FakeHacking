// Piccoli aiuti condivisi: numeri casuali, attese, DOM.

export const rand = (min: number, max: number) => Math.random() * (max - min) + min;
export const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));
export const pick = <T>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];
export const chance = (p: number) => Math.random() < p;
export const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export const hex = (n: number, len = 2) => n.toString(16).toUpperCase().padStart(len, '0');
export const randHex = (bytes: number, sep = '') =>
  Array.from({ length: bytes }, () => hex(randInt(0, 255))).join(sep);
export const fakeIp = (local = true) =>
  local
    ? `192.168.1.${randInt(2, 254)}`
    : `${randInt(11, 223)}.${randInt(0, 255)}.${randInt(0, 255)}.${randInt(1, 254)}`;
export const fakeMac = () => randHex(6, ':');

export function clock(withMs = false): string {
  const d = new Date();
  const t = d.toLocaleTimeString('it-IT', { hour12: false });
  return withMs ? `${t}.${String(d.getMilliseconds()).padStart(3, '0')}` : t;
}

export const formatNumber = (n: number) => Math.round(n).toLocaleString('it-IT');

/** Minuscole e senza accenti, per confrontare quello che scrive l'utente. */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  html?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined) node.innerHTML = html;
  return node;
}

export const icon = (name: string, cls = '') => `<i class="codicon codicon-${name} ${cls}"></i>`;

// --- Interruzione delle sequenze -------------------------------------------
// Esc annulla tutto: ogni sequenza usa una Run, che smette di aspettare quando
// l'epoca cambia.

let epoch = 0;
export class Aborted extends Error {}

export function abortAll() {
  epoch++;
}

export interface Run {
  sleep(ms: number): Promise<void>;
  alive(): boolean;
}

export function createRun(): Run {
  const start = epoch;
  return {
    alive: () => epoch === start,
    async sleep(ms: number) {
      await sleep(ms);
      if (epoch !== start) throw new Aborted();
    },
  };
}
