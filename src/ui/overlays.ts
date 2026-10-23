// Effetti da film: finestre fluttuanti, scritte giganti, allarme, Matrix, notifiche.
import { sfx } from '../core/sfx';
import { el, escapeHtml, icon, randInt, sleep } from '../core/util';

const layer = () => document.getElementById('overlay-layer')!;
const winLayer = () => document.getElementById('windows-layer')!;

// --- Finestre fluttuanti ---------------------------------------------------

export interface FloatWin {
  root: HTMLElement;
  body: HTMLElement;
  setTitle(t: string): void;
  close(): void;
  closeAfter(ms: number): void;
  onClose(fn: () => void): void;
  readonly closed: boolean;
}

const MAX_WINDOWS = 4;
const openWins: FloatWin[] = [];
let zTop = 1;

export function openWindow(opts: { title: string; icon?: string; w: number; h: number }): FloatWin {
  while (openWins.length >= MAX_WINDOWS) openWins[0].close();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(opts.w, vw - 40);
  const h = Math.min(opts.h, vh - 80);
  const root = el('div', 'fwin');
  root.style.width = `${w}px`;
  root.style.height = `${h}px`;
  root.style.left = `${Math.max(10, (vw - w) / 2 + randInt(-vw * 0.18, vw * 0.12))}px`;
  root.style.top = `${Math.max(40, (vh - h) / 2 + randInt(-vh * 0.15, vh * 0.08))}px`;
  root.style.zIndex = String(++zTop);
  root.innerHTML = `<div class="fwin-head">${icon(opts.icon ?? 'terminal')}<span class="title">${escapeHtml(opts.title)}</span><i class="codicon codicon-close x"></i></div>`;
  const body = el('div', 'fwin-body');
  root.append(body);
  winLayer().append(root);

  let closed = false;
  let timer = 0;
  const closeFns: (() => void)[] = [];
  const win: FloatWin = {
    root,
    body,
    get closed() {
      return closed;
    },
    setTitle(t) {
      root.querySelector('.title')!.textContent = t;
    },
    onClose(fn) {
      closeFns.push(fn);
    },
    close() {
      if (closed) return;
      closed = true;
      clearTimeout(timer);
      closeFns.forEach((fn) => fn());
      openWins.splice(openWins.indexOf(win), 1);
      root.classList.add('closing');
      setTimeout(() => root.remove(), 260);
    },
    closeAfter(ms) {
      clearTimeout(timer);
      timer = window.setTimeout(() => win.close(), ms);
    },
  };
  openWins.push(win);
  root.querySelector('.x')!.addEventListener('click', () => win.close());
  root.addEventListener('mousedown', () => {
    root.style.zIndex = String(++zTop);
    openWins.forEach((o) => o.root.classList.toggle('active', o === win));
  });
  makeDraggable(root, root.querySelector('.fwin-head')!);
  return win;
}

function makeDraggable(root: HTMLElement, handle: HTMLElement) {
  handle.addEventListener('mousedown', (e) => {
    const sx = e.clientX - root.offsetLeft;
    const sy = e.clientY - root.offsetTop;
    const move = (ev: MouseEvent) => {
      root.style.left = `${ev.clientX - sx}px`;
      root.style.top = `${Math.max(0, ev.clientY - sy)}px`;
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
  });
}

export function closeAllWindows() {
  [...openWins].forEach((w) => w.close());
}

export const hasWindows = () => openWins.length > 0;

// --- Scritte giganti -------------------------------------------------------

export type Tone = 'ok' | 'err' | 'warn' | 'info';

export async function banner(text: string, tone: Tone, sub = '', ms = 2200) {
  layer().querySelectorAll('.banner').forEach((b) => b.remove());
  const b = el('div', `banner ${tone}`, `${escapeHtml(text)}${sub ? `<small>${escapeHtml(sub)}</small>` : ''}`);
  layer().append(b);
  if (tone === 'ok') sfx.success();
  else if (tone === 'err') sfx.denied();
  else sfx.alert();
  glitch();
  await sleep(ms);
  b.classList.add('out');
  await sleep(300);
  b.remove();
}

export function accessGranted(sub = '') {
  return banner('ACCESS GRANTED', 'ok', sub);
}

export function accessDenied(sub = '') {
  shake();
  return banner('ACCESS DENIED', 'err', sub);
}

// --- Scossoni e glitch -----------------------------------------------------

function pulseClass(cls: string, ms: number) {
  document.body.classList.remove(cls);
  void document.body.offsetWidth;
  document.body.classList.add(cls);
  setTimeout(() => document.body.classList.remove(cls), ms);
}

export const shake = () => pulseClass('shake', 460);
export const glitch = () => pulseClass('glitch', 360);

// --- Allarme rosso ----------------------------------------------------------

let alarmEl: HTMLElement | null = null;
let alarmTimer = 0;

export function setAlarm(on: boolean, ms = 0) {
  clearTimeout(alarmTimer);
  if (on) {
    if (!alarmEl) {
      alarmEl = el('div', 'alarm-vignette');
      layer().append(alarmEl);
      document.body.classList.add('red-alert');
    }
    sfx.siren(ms || 4000);
    if (ms) alarmTimer = window.setTimeout(() => setAlarm(false), ms);
  } else {
    alarmEl?.remove();
    alarmEl = null;
    document.body.classList.remove('red-alert');
  }
}

export const alarmOn = () => alarmEl !== null;

// --- Matrix -----------------------------------------------------------------

let matrixStop: (() => void) | null = null;

export function matrix(ms = 7000): Promise<void> {
  matrixStop?.();
  return new Promise((resolve) => {
    const canvas = el('canvas', 'matrix');
    layer().append(canvas);
    const dpr = window.devicePixelRatio || 1;
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const size = 18;
    const cols = Math.ceil(w / size);
    const drops = Array.from({ length: cols }, () => randInt(-40, 0));
    const chars = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ0123456789PIZZAπ∑ΩΨ';
    ctx.font = `${size}px "JetBrains Mono", monospace`;
    let raf = 0;
    let last = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (now - last < 45) return;
      last = now;
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < cols; i++) {
        const ch = chars[randInt(0, chars.length - 1)];
        const y = drops[i] * size;
        ctx.fillStyle = Math.random() < 0.08 ? '#d8ffe0' : '#00ff66';
        ctx.fillText(ch, i * size, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      }
    };
    raf = requestAnimationFrame(draw);
    const stop = () => {
      cancelAnimationFrame(raf);
      canvas.style.transition = 'opacity .5s';
      canvas.style.opacity = '0';
      setTimeout(() => canvas.remove(), 500);
      matrixStop = null;
      clearTimeout(timer);
      resolve();
    };
    const timer = setTimeout(stop, ms);
    matrixStop = stop;
  });
}

// --- Conto alla rovescia ---------------------------------------------------

export function countdownOverlay(): { root: HTMLElement; set(n: number, msg: string): void; remove(): void } {
  const root = el('div', 'countdown', '<div class="t">AUTODISTRUZIONE</div><div class="n"></div><div class="s"></div>');
  layer().append(root);
  return {
    root,
    set(n, msg) {
      root.querySelector('.n')!.textContent = String(n);
      root.querySelector('.s')!.textContent = msg;
    },
    remove() {
      root.remove();
    },
  };
}

export function flash() {
  const f = el('div', 'flash');
  layer().append(f);
  setTimeout(() => f.remove(), 1300);
}

export async function joke(big: string, line: string, ms = 3200) {
  const j = el('div', 'joke', `<b>${escapeHtml(big)}</b><span>${escapeHtml(line)}</span>`);
  layer().append(j);
  await sleep(ms);
  j.style.transition = 'opacity .4s';
  j.style.opacity = '0';
  await sleep(400);
  j.remove();
}

/** Toglie tutto quello che copre lo schermo (Esc). */
export function clearOverlays() {
  matrixStop?.();
  setAlarm(false);
  layer().querySelectorAll('.banner, .countdown, .joke, .win-screen').forEach((n) => n.remove());
}

// --- Notifiche --------------------------------------------------------------

export function toast(msg: string, tone: Tone = 'info', source = 'Mainframe', ms = 5000) {
  const box = document.getElementById('toasts')!;
  const icons: Record<Tone, string> = { ok: 'pass', info: 'info', warn: 'warning', err: 'error' };
  const t = el('div', `toast ${tone}`, `${icon(icons[tone])}<div class="msg">${escapeHtml(msg)}<span class="src">Fonte: ${escapeHtml(source)}</span></div>${icon('close')}`);
  box.append(t);
  while (box.childElementCount > 4) box.firstElementChild!.remove();
  const close = () => {
    t.classList.add('out');
    setTimeout(() => t.remove(), 300);
  };
  t.querySelector('.codicon-close')!.addEventListener('click', close);
  setTimeout(close, ms);
}
