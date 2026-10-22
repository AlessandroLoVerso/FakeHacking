// Mappa del mondo su canvas: archi tra città, ping, zoom e triangolazione.
// I confini vengono da Natural Earth (pubblico dominio) tramite world-atlas.
import { geoGraticule10, geoInterpolate, geoNaturalEarth1, geoPath, type GeoPermissibleObjects } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Topology } from 'topojson-specification';
import landTopo from 'world-atlas/land-110m.json';
import { bus } from '../core/bus';
import { clamp, pick, rand, randInt, sleep } from '../core/util';
import { ITALIAN_CITIES, WORLD_CITIES, type City } from '../data/cities';

const topo = landTopo as unknown as Topology;
const LAND = feature(topo, topo.objects.land) as unknown as GeoPermissibleObjects;
const GRATICULE = geoGraticule10();
const SPHERE: GeoPermissibleObjects = { type: 'Sphere' };

type LonLat = [number, number];

interface Arc {
  a: LonLat;
  b: LonLat;
  t0: number;
  dur: number;
  keep: number;
  color: string;
}
interface Ping {
  p: LonLat;
  t0: number;
  color: string;
  size: number;
}
interface Label {
  p: LonLat;
  text: string;
  t0: number;
  ttl: number;
  color: string;
}
interface View {
  lon: number;
  lat: number;
  k: number;
}

const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const ll = (c: City): LonLat => [c.lon, c.lat];

export class WorldMap {
  private ctx: CanvasRenderingContext2D;
  private proj = geoNaturalEarth1();
  private baseScale = 100;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private arcs: Arc[] = [];
  private pings: Ping[] = [];
  private labels: Label[] = [];
  private view: View = { lon: 12, lat: 8, k: 1 };
  private tween: { from: View; to: View; t0: number; dur: number } | null = null;
  private target: { p: LonLat; t0: number; dur: number } | null = null;
  private colors: Record<string, string> = {};
  private pattern: CanvasPattern | null = null;
  private raf = 0;
  private alive = true;
  private ro: ResizeObserver;

  constructor(private canvas: HTMLCanvasElement, idle: boolean) {
    this.ctx = canvas.getContext('2d')!;
    this.readColors();
    bus.on('settings', () => requestAnimationFrame(() => this.readColors()));
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(canvas);
    this.resize();
    this.raf = requestAnimationFrame(this.frame);
    if (idle) this.idleLoop();
  }

  destroy() {
    this.alive = false;
    cancelAnimationFrame(this.raf);
    this.ro.disconnect();
  }

  private readColors() {
    const cs = getComputedStyle(document.documentElement);
    const v = (n: string) => cs.getPropertyValue(n).trim();
    this.colors = {
      land: v('--map-land') || '#3b4b5c',
      line: v('--map-line') || '#4ec9b0',
      ok: v('--ok-strong'),
      warn: v('--warn-strong'),
      err: v('--err'),
      info: v('--info'),
      fg: v('--fg'),
      dim: v('--fg-dim'),
    };
    this.makePattern();
  }

  private makePattern() {
    const tile = document.createElement('canvas');
    const s = Math.round(4 * this.dpr);
    tile.width = tile.height = s;
    const t = tile.getContext('2d')!;
    t.fillStyle = this.colors.land;
    t.globalAlpha = 0.25;
    t.fillRect(0, 0, s, s);
    t.globalAlpha = 1;
    t.beginPath();
    t.arc(s / 2, s / 2, 0.85 * this.dpr, 0, Math.PI * 2);
    t.fillStyle = this.colors.line;
    t.fill();
    this.pattern = this.ctx.createPattern(tile, 'repeat');
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    this.w = Math.max(10, r.width);
    this.h = Math.max(10, r.height);
    this.canvas.width = this.w * this.dpr;
    this.canvas.height = this.h * this.dpr;
    const p = geoNaturalEarth1().fitExtent(
      [
        [4, 4],
        [this.w - 4, this.h - 4],
      ],
      SPHERE,
    );
    this.baseScale = p.scale();
    this.makePattern();
  }

  private applyView(now: number) {
    if (this.tween) {
      const k = clamp((now - this.tween.t0) / this.tween.dur, 0, 1);
      const e = ease(k);
      const { from, to } = this.tween;
      this.view = {
        lon: from.lon + (to.lon - from.lon) * e,
        lat: from.lat + (to.lat - from.lat) * e,
        k: from.k + (to.k - from.k) * e,
      };
      if (k >= 1) this.tween = null;
    }
    this.proj
      .rotate([-this.view.lon, 0])
      .center([0, this.view.lat])
      .scale(this.baseScale * this.view.k)
      .translate([this.w / 2, this.h / 2]);
  }

  private frame = (now: number) => {
    if (!this.alive) return;
    this.raf = requestAnimationFrame(this.frame);
    if (!this.canvas.isConnected) return;
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    this.applyView(now);
    const path = geoPath(this.proj, ctx);
    const c = this.colors;

    ctx.lineWidth = 0.6;
    ctx.globalAlpha = 0.18;
    ctx.strokeStyle = c.line;
    ctx.beginPath();
    path(GRATICULE);
    ctx.stroke();
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    path(SPHERE);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.beginPath();
    path(LAND);
    ctx.fillStyle = this.pattern ?? c.land;
    ctx.fill();
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = 0.7;
    ctx.strokeStyle = c.line;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Linea di scansione che attraversa la mappa.
    const sx = ((now / 4000) % 1) * this.w;
    const grad = ctx.createLinearGradient(sx - 40, 0, sx, 0);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(1, c.line);
    ctx.globalAlpha = 0.12;
    ctx.fillStyle = grad;
    ctx.fillRect(sx - 40, 0, 40, this.h);
    ctx.globalAlpha = 1;

    this.drawArcs(now);
    this.drawPings(now);
    this.drawTarget(now);
    this.drawLabels(now);
  };

  private project(p: LonLat): [number, number] | null {
    return this.proj(p) ?? null;
  }

  private drawArcs(now: number) {
    const ctx = this.ctx;
    this.arcs = this.arcs.filter((a) => now < a.t0 + a.dur + a.keep);
    for (const a of this.arcs) {
      if (now < a.t0) continue;
      const prog = clamp((now - a.t0) / a.dur, 0, 1);
      const fade = now > a.t0 + a.dur ? 1 - (now - a.t0 - a.dur) / a.keep : 1;
      const interp = geoInterpolate(a.a, a.b);
      const steps = 40;
      ctx.beginPath();
      let last: [number, number] | null = null;
      let prev: [number, number] | null = null;
      for (let i = 0; i <= steps * prog; i++) {
        const pt = this.project(interp(i / steps) as LonLat);
        if (!pt) continue;
        if (!prev || Math.abs(pt[0] - prev[0]) > this.w / 2) ctx.moveTo(pt[0], pt[1]);
        else ctx.lineTo(pt[0], pt[1]);
        prev = pt;
        last = pt;
      }
      ctx.globalAlpha = Math.max(0, fade);
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 1.6;
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;
      for (const end of [a.a, prog >= 1 ? a.b : null]) {
        const p = end && this.project(end);
        if (p) {
          ctx.fillStyle = a.color;
          ctx.fillRect(p[0] - 2, p[1] - 2, 4, 4);
        }
      }
      if (last && prog < 1) {
        ctx.beginPath();
        ctx.arc(last[0], last[1], 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = a.color;
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
      ctx.globalAlpha = 1;
    }
  }

  private drawPings(now: number) {
    const ctx = this.ctx;
    this.pings = this.pings.filter((p) => now - p.t0 < 1600);
    for (const p of this.pings) {
      const pt = this.project(p.p);
      if (!pt) continue;
      const k = (now - p.t0) / 1600;
      ctx.beginPath();
      ctx.arc(pt[0], pt[1], 2 + k * p.size, 0, Math.PI * 2);
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = 1 - k;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  private drawLabels(now: number) {
    const ctx = this.ctx;
    this.labels = this.labels.filter((l) => now - l.t0 < l.ttl);
    ctx.font = `600 ${Math.max(10, Math.min(13, this.w / 50))}px "JetBrains Mono", monospace`;
    for (const l of this.labels) {
      const pt = this.project(l.p);
      if (!pt) continue;
      const k = (now - l.t0) / l.ttl;
      ctx.globalAlpha = k > 0.8 ? (1 - k) * 5 : 1;
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      const tw = ctx.measureText(l.text).width;
      ctx.fillRect(pt[0] + 6, pt[1] - 16, tw + 8, 15);
      ctx.fillStyle = l.color;
      ctx.fillText(l.text, pt[0] + 10, pt[1] - 5);
      ctx.globalAlpha = 1;
    }
  }

  private drawTarget(now: number) {
    if (!this.target) return;
    const pt = this.project(this.target.p);
    if (!pt) return;
    const ctx = this.ctx;
    const k = clamp((now - this.target.t0) / this.target.dur, 0, 1);
    const D = Math.min(this.w, this.h) * 0.22;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 3; i++) {
      const ang = (Math.PI * 2 * i) / 3 - Math.PI / 2;
      const tx = pt[0] + Math.cos(ang) * D;
      const ty = pt[1] + Math.sin(ang) * D;
      const wobble = Math.sin(now / 90 + i * 2) * 10 * (1 - k);
      const r = D * (1 + (1 - k) * 0.9) + wobble;
      ctx.strokeStyle = this.colors.warn;
      ctx.globalAlpha = 0.75;
      ctx.beginPath();
      ctx.arc(tx, ty, Math.max(1, r), 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = this.colors.warn;
      ctx.fillRect(tx - 3, ty - 3, 6, 6);
    }
    ctx.globalAlpha = 1;
    if (k >= 1) {
      const pulse = 8 + Math.sin(now / 120) * 3;
      ctx.strokeStyle = this.colors.err;
      ctx.lineWidth = 2;
      ctx.strokeRect(pt[0] - pulse, pt[1] - pulse, pulse * 2, pulse * 2);
      ctx.beginPath();
      ctx.moveTo(pt[0] - 30, pt[1]);
      ctx.lineTo(pt[0] + 30, pt[1]);
      ctx.moveTo(pt[0], pt[1] - 30);
      ctx.lineTo(pt[0], pt[1] + 30);
      ctx.stroke();
    }
  }

  // --- API usata dalle sequenze ---------------------------------------------

  arc(a: City, b: City, dur: number, color = this.colors.line, keep = 2500): Promise<void> {
    this.arcs.push({ a: ll(a), b: ll(b), t0: performance.now(), dur, keep, color });
    return sleep(dur);
  }

  ping(c: City, color = this.colors.ok, size = 18) {
    this.pings.push({ p: ll(c), t0: performance.now(), color, size });
  }

  label(c: City, text: string, ttl = 2500, color = this.colors.fg) {
    this.labels.push({ p: ll(c), text, t0: performance.now(), ttl, color });
  }

  focus(lon: number, lat: number, k: number, dur: number): Promise<void> {
    this.tween = { from: { ...this.view }, to: { lon, lat, k }, t0: performance.now(), dur };
    return sleep(dur);
  }

  triangulate(c: City, dur: number): Promise<void> {
    this.target = { p: ll(c), t0: performance.now(), dur };
    return sleep(dur);
  }

  color(name: 'ok' | 'warn' | 'err' | 'info' | 'line'): string {
    return this.colors[name];
  }

  private async idleLoop() {
    const all = [...WORLD_CITIES, ...ITALIAN_CITIES];
    while (this.alive) {
      await sleep(randInt(700, 1500));
      if (!this.alive || this.target) continue;
      const a = pick(all);
      const b = pick(all);
      if (a === b) continue;
      const col = pick([this.colors.line, this.colors.line, this.colors.info, this.colors.warn]);
      void this.arc(a, b, rand(900, 1600), col, 1800).then(() => this.ping(b, col));
      if (Math.random() < 0.25) this.label(b, b.name.toUpperCase(), 1800, this.colors.dim);
    }
  }
}
