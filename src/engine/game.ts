// Il lato "giochino": punti livello hacker e missioni da completare.
import { bus, type MissionId } from '../core/bus';
import { sfx } from '../core/sfx';
import { el, escapeHtml, randInt } from '../core/util';

export const MISSIONS: { id: MissionId; label: string }[] = [
  { id: 'phone', label: 'Entra in un telefono' },
  { id: 'trace', label: 'Localizza qualcuno' },
  { id: 'decrypt', label: 'Decifra una password' },
  { id: 'download', label: 'Ruba la ricetta della nonna' },
  { id: 'firewall', label: 'Sfonda un firewall' },
  { id: 'scan', label: 'Scansiona la rete' },
  { id: 'matrix', label: 'Entra in Matrix' },
  { id: 'nuke', label: 'Premi il pulsante rosso' },
];

const done = new Set<MissionId>();
let points = 1337;

export const game = {
  get points() {
    return points;
  },
  isDone: (id: MissionId) => done.has(id),
  addPoints(n: number) {
    points += n;
    bus.emit('points', points);
  },
  complete(id: MissionId) {
    if (done.has(id)) return;
    done.add(id);
    bus.emit('mission', id);
    this.addPoints(500);
    if (done.size === MISSIONS.length) setTimeout(showWin, 1800);
  },
};

function showWin() {
  const layer = document.getElementById('overlay-layer')!;
  const screen = el(
    'div',
    'win-screen',
    `<canvas></canvas><div class="trophy">🏆</div><h1>HAI HACKERATO INTERNET</h1>
     <p>Tutte le missioni completate. Livello hacker: ${escapeHtml(points.toLocaleString('it-IT'))}</p>
     <p class="c-dim">(Nessun frigorifero è stato maltrattato. Premi Esc per continuare.)</p>`,
  );
  layer.append(screen);
  sfx.success();
  setTimeout(() => sfx.success(), 400);
  const canvas = screen.querySelector('canvas')!;
  const ctx = canvas.getContext('2d')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  const bits = Array.from({ length: 160 }, () => ({
    x: Math.random() * canvas.width,
    y: -Math.random() * canvas.height,
    v: 2 + Math.random() * 5,
    c: Math.random() < 0.5 ? '0' : '1',
    col: ['#ffd700', '#23d18b', '#3794ff', '#ff5f57'][randInt(0, 3)],
  }));
  ctx.font = 'bold 22px "JetBrains Mono", monospace';
  const draw = () => {
    if (!screen.isConnected) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const b of bits) {
      b.y += b.v;
      if (b.y > canvas.height) b.y = -20;
      ctx.fillStyle = b.col;
      ctx.fillText(b.c, b.x, b.y);
    }
    requestAnimationFrame(draw);
  };
  draw();
  screen.addEventListener('click', () => screen.remove());
}
