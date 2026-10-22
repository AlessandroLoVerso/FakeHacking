// L'editor "hackertyper": ogni tasto premuto scrive qualche carattere di codice.
import { CODE_FILES, type CodeFile } from '../data/code';
import { bus } from '../core/bus';
import { el, icon, randInt } from '../core/util';
import { tokenize, toHtml, type Tok } from './highlight';

const MAX_LINES = 400;
const TRIM_LINES = 100;

interface Buffer {
  lines: string[];
  toks: Tok[][];
  offset: number;
  pos: number;
  dirty: boolean;
}

export class Editor {
  private idx = 0;
  private buffers: Buffer[] = CODE_FILES.map(() => ({ lines: [''], toks: [[]], offset: 0, pos: 0, dirty: false }));
  private scroller!: HTMLElement;
  private minimap!: HTMLCanvasElement;
  private lineEls: HTMLDivElement[] = [];
  private tabsEl!: HTMLElement;
  private crumbsEl!: HTMLElement;
  private root!: HTMLElement;
  private typingTimer = 0;
  private minimapDirty = true;
  private palette: Record<string, string> = {};
  onFileChange: (file: CodeFile) => void = () => {};

  mount(root: HTMLElement, tabs: HTMLElement, crumbs: HTMLElement) {
    this.root = root;
    this.tabsEl = tabs;
    this.crumbsEl = crumbs;
    this.scroller = el('div', 'scroller');
    this.minimap = el('canvas', 'minimap');
    const hint = el('div', 'focus-hint', 'Modalità hacker: scrivi qualsiasi cosa · Ctrl+` per la console');
    root.append(this.scroller, this.minimap, hint);
    this.readPalette();
    bus.on('settings', () => requestAnimationFrame(() => this.readPalette()));
    setInterval(() => this.drawMinimap(), 250);
    window.addEventListener('resize', () => (this.minimapDirty = true));
    this.open(0);
  }

  get file(): CodeFile {
    return CODE_FILES[this.idx];
  }

  get files(): CodeFile[] {
    return CODE_FILES;
  }

  open(i: number) {
    this.idx = i;
    this.renderTabs();
    const f = this.file;
    this.crumbsEl.innerHTML = `OPERAZIONE_PIZZA ${icon('chevron-right')} <span style="color:${f.color}">${icon(f.icon)}</span> ${f.name} ${icon('chevron-right')} ${icon('symbol-method')} ${f.symbol}`;
    const buf = this.buffers[i];
    // Un file appena aperto mostra già qualche riga, così lo schermo non è vuoto.
    if (buf.pos === 0) this.advance(buf, randInt(260, 420));
    this.scroller.innerHTML = '';
    this.lineEls = buf.lines.map((_, n) => this.makeLine(buf, n));
    this.scroller.append(...this.lineEls);
    this.refreshActive(buf);
    this.minimapDirty = true;
    this.onFileChange(f);
  }

  /** Scrive `n` caratteri del file corrente. */
  type(n: number) {
    const buf = this.buffers[this.idx];
    const before = buf.lines.length;
    const finalized = this.advance(buf, n);
    for (const line of finalized) {
      const elLine = this.lineEls[line - buf.offset];
      if (elLine) elLine.innerHTML = this.lineHtml(buf, line - buf.offset, false);
    }
    for (let k = before; k < buf.lines.length; k++) {
      const node = this.makeLine(buf, k);
      this.lineEls.push(node);
      this.scroller.append(node);
    }
    this.trim(buf);
    if (!buf.dirty) {
      buf.dirty = true;
      this.renderTabs();
    }
    this.refreshActive(buf);
    this.root.classList.add('typing');
    clearTimeout(this.typingTimer);
    this.typingTimer = window.setTimeout(() => this.root.classList.remove('typing'), 500);
    this.minimapDirty = true;
  }

  /** Cancella `n` caratteri (Backspace). */
  erase(n: number) {
    const buf = this.buffers[this.idx];
    for (let k = 0; k < n; k++) {
      const last = buf.lines.length - 1;
      if (buf.lines[last].length > 0) {
        buf.lines[last] = buf.lines[last].slice(0, -1);
      } else if (last > 0) {
        buf.lines.pop();
        buf.toks.pop();
        this.lineEls.pop()?.remove();
      } else break;
      buf.pos = Math.max(0, buf.pos - 1);
    }
    this.refreshActive(buf);
    this.minimapDirty = true;
  }

  private advance(buf: Buffer, n: number): number[] {
    const src = this.file.code;
    const finalized: number[] = [];
    for (let k = 0; k < n; k++) {
      const ch = src[buf.pos % src.length];
      buf.pos++;
      if (ch === '\n') {
        const last = buf.lines.length - 1;
        buf.toks[last] = tokenize(buf.lines[last], this.file.lang);
        finalized.push(buf.offset + last);
        buf.lines.push('');
        buf.toks.push([]);
      } else {
        buf.lines[buf.lines.length - 1] += ch;
      }
    }
    return finalized;
  }

  private trim(buf: Buffer) {
    if (buf.lines.length <= MAX_LINES) return;
    buf.lines.splice(0, TRIM_LINES);
    buf.toks.splice(0, TRIM_LINES);
    buf.offset += TRIM_LINES;
    this.lineEls.splice(0, TRIM_LINES).forEach((n) => n.remove());
    this.lineEls.forEach((node, k) => {
      (node.firstElementChild as HTMLElement).textContent = String(buf.offset + k + 1);
    });
  }

  private makeLine(buf: Buffer, n: number): HTMLDivElement {
    const node = el('div', 'ln');
    node.innerHTML = this.lineHtml(buf, n, false);
    return node;
  }

  private lineHtml(buf: Buffer, n: number, active: boolean): string {
    const toks = active || buf.toks[n].length === 0 ? tokenize(buf.lines[n], this.file.lang) : buf.toks[n];
    return `<span class="num">${buf.offset + n + 1}</span><span>${toHtml(toks)}${active ? '<span class="cursor"></span>' : ''}</span>`;
  }

  private refreshActive(buf: Buffer) {
    const last = buf.lines.length - 1;
    this.lineEls.forEach((node, k) => {
      if (node.classList.contains('active') && k !== last) {
        node.classList.remove('active');
        node.innerHTML = this.lineHtml(buf, k, false);
      }
    });
    const cur = this.lineEls[last];
    if (!cur) return;
    cur.classList.add('active');
    cur.innerHTML = this.lineHtml(buf, last, true);
    const target = cur.offsetTop - this.scroller.clientHeight * 0.65;
    this.scroller.scrollTop = Math.max(0, target);
    bus.emit('cursor', { line: buf.offset + last + 1, col: buf.lines[last].length + 1, lang: this.file.langLabel });
  }

  private renderTabs() {
    this.tabsEl.innerHTML = '';
    CODE_FILES.forEach((f, i) => {
      const tab = el(
        'div',
        `tab${i === this.idx ? ' active' : ''}${this.buffers[i].dirty ? ' dirty' : ''}`,
        `<span style="color:${f.color}">${icon(f.icon)}</span>${f.name}<i class="codicon codicon-close close"></i>`,
      );
      tab.addEventListener('click', () => this.open(i));
      this.tabsEl.append(tab);
    });
  }

  private readPalette() {
    const cs = getComputedStyle(document.documentElement);
    for (const k of ['tk-kw', 'tk-ctrl', 'tk-str', 'tk-num', 'tk-com', 'tk-fn', 'tk-type', 'tk-var', 'tk-op']) {
      this.palette[k] = cs.getPropertyValue(`--${k}`).trim() || '#888';
    }
    this.minimapDirty = true;
  }

  private drawMinimap() {
    if (!this.minimapDirty || !this.minimap.isConnected) return;
    this.minimapDirty = false;
    const dpr = window.devicePixelRatio || 1;
    const w = this.minimap.clientWidth;
    const h = this.minimap.clientHeight;
    if (!w || !h) return;
    this.minimap.width = w * dpr;
    this.minimap.height = h * dpr;
    const ctx = this.minimap.getContext('2d')!;
    ctx.scale(dpr, dpr);
    const buf = this.buffers[this.idx];
    const lh = 3;
    const maxRows = Math.floor(h / lh);
    const start = Math.max(0, buf.lines.length - maxRows);
    for (let n = start; n < buf.lines.length; n++) {
      const toks = buf.toks[n].length ? buf.toks[n] : tokenize(buf.lines[n], this.file.lang);
      let x = 6;
      const y = (n - start) * lh;
      for (const t of toks) {
        const len = t.t.length * 0.9;
        if (t.t.trim()) {
          ctx.fillStyle = this.palette[t.c] ?? '#888';
          ctx.globalAlpha = 0.85;
          ctx.fillRect(x, y, len, 2);
        }
        x += len;
        if (x > w) break;
      }
    }
    const visible = Math.floor(this.scroller.clientHeight / (this.lineEls[0]?.offsetHeight || 18));
    const top = Math.max(0, (buf.lines.length - start - visible * 0.7) * lh);
    ctx.globalAlpha = 1;
    ctx.fillStyle = 'rgba(121,121,121,0.18)';
    ctx.fillRect(0, top, w, visible * lh);
  }
}

export const editor = new Editor();
