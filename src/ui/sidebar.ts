// Barra laterale: explorer con i file, missioni e grafici del "monitor".
import { bus } from '../core/bus';
import { clamp, el, hex, icon, randHex } from '../core/util';
import { CODE_FILES } from '../data/code';
import { MISSIONS, game } from '../engine/game';
import { editor } from './editor';
import { toast } from './overlays';

let intensity = 0;
bus.on('pulse', (p) => (intensity = Math.min(3, intensity + p)));
setInterval(() => (intensity = Math.max(0, intensity - 0.1)), 400);

const EXTRA_FILES = [
  { name: 'segreti_della_nonna.zip', icon: 'file-zip', color: '#c09553' },
  { name: 'NON_APRIRE.txt', icon: 'file', color: '#858585' },
  { name: 'piano_conquista_mondo.md', icon: 'markdown', color: '#519aba' },
];

export function mountSidebar(side: HTMLElement) {
  side.innerHTML = `<div class="side-title"><span>EXPLORER</span>${icon('ellipsis')}</div>`;

  const explorer = el('div', 'tree');
  explorer.innerHTML = `<div class="section-head">${icon('chevron-down')} OPERAZIONE_PIZZA</div>`;
  const rows: HTMLElement[] = [];
  CODE_FILES.forEach((f, i) => {
    const row = el('div', 'row', `<span style="color:${f.color}">${icon(f.icon)}</span>${f.name}<span class="mod"></span>`);
    row.style.setProperty('--depth', '1');
    row.addEventListener('click', () => editor.open(i));
    rows.push(row);
    explorer.append(row);
  });
  for (const f of EXTRA_FILES) {
    const row = el('div', 'row', `<span style="color:${f.color}">${icon(f.icon)}</span>${f.name}`);
    row.style.setProperty('--depth', '1');
    row.addEventListener('click', () =>
      toast(`"${f.name}" è protetto da password. Prova a scrivere "decrypt" in console.`, 'warn', 'Explorer'),
    );
    explorer.append(row);
  }
  editor.onFileChange = (f) => {
    rows.forEach((r, i) => {
      r.classList.toggle('active', CODE_FILES[i] === f);
    });
  };

  const missions = el('div', 'tree missions');
  const renderMissions = () => {
    const doneCount = MISSIONS.filter((m) => game.isDone(m.id)).length;
    missions.innerHTML = `<div class="section-head">${icon('chevron-down')} MISSIONI (${doneCount}/${MISSIONS.length})</div>`;
    for (const m of MISSIONS) {
      const ok = game.isDone(m.id);
      const row = el('div', `row${ok ? ' done' : ''}`, `${icon(ok ? 'pass-filled' : 'circle-large')}<span>${m.label}</span>`);
      row.style.setProperty('--depth', '1');
      missions.append(row);
    }
  };
  renderMissions();
  bus.on('mission', renderMissions);

  const monitor = el('div', 'monitor');
  const monitorHead = el('div', 'section-head', `${icon('chevron-down')} MONITOR`);
  const charts = [
    makeSpark('TRAFFICO', 'Mb/s', 40, 900),
    makeSpark('CPU', '%', 20, 100),
    makeSpark('PACCHETTI', '/s', 200, 9000),
  ];
  const hexdump = el('div', 'hexdump');
  monitor.append(...charts.map((c) => c.root), hexdump);
  side.append(explorer, missions, monitorHead, monitor);

  setInterval(() => charts.forEach((c) => c.tick()), 300);
  let addr = 0x0040a000;
  setInterval(() => {
    const lines: string[] = [];
    for (let i = 0; i < 18; i++) {
      addr += 8;
      const bytes = randHex(8, ' ');
      lines.push(i === 17 ? `<span class="hl">${hex(addr, 8)} ${bytes}</span>` : `${hex(addr, 8)} ${bytes}`);
    }
    hexdump.innerHTML = lines.join('\n');
  }, 220);
}

function makeSpark(label: string, unit: string, base: number, max: number) {
  const root = el('div', 'spark');
  const lbl = el('div', 'lbl', `<span>${label}</span><b></b>`);
  const canvas = el('canvas');
  root.append(lbl, canvas);
  const values: number[] = Array.from({ length: 60 }, () => base);
  let v = base;
  const tick = () => {
    const target = base + intensity * (max - base) * 0.3;
    v = clamp(v + (target - v) * 0.3 + (Math.random() - 0.5) * (max - base) * 0.12, base * 0.3, max);
    values.push(v);
    values.shift();
    lbl.querySelector('b')!.textContent = `${Math.round(v).toLocaleString('it-IT')} ${unit}`;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    const ctx = canvas.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const color = getComputedStyle(document.documentElement).getPropertyValue('--ok').trim();
    ctx.beginPath();
    values.forEach((val, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - (val / max) * (h - 2) - 1;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    ctx.fill();
  };
  return { root, tick };
}
