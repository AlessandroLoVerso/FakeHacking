// I tre terminali in basso: due scorrono da soli, il terzo è la console dove scrivi tu.
import { bus } from '../core/bus';
import { promptUser } from '../core/settings';
import { clock, el, escapeHtml, fakeIp, hex, icon, pick, randHex, randInt, sleep } from '../core/util';

const MAX_LOG_LINES = 120;
let intensity = 0;
bus.on('pulse', (p) => (intensity = Math.min(3, intensity + p)));
setInterval(() => (intensity = Math.max(0, intensity - 0.15)), 400);

function makeTerm(title: string, iconName: string, cls = ''): { root: HTMLElement; out: HTMLElement } {
  const root = el('div', `term ${cls}`);
  root.innerHTML = `<div class="term-head">${icon(iconName)} ${title}<span class="live">● live</span></div>`;
  const out = el('div', 'term-out');
  root.append(out);
  return { root, out };
}

function appendLine(out: HTMLElement, html: string, max = MAX_LOG_LINES): HTMLElement {
  const line = el('div', 'l', html);
  out.append(line);
  while (out.childElementCount > max) out.firstElementChild!.remove();
  return line;
}

/** Terminale che si riempie da solo, sempre più veloce quando succede qualcosa. */
function startLogTerm(out: HTMLElement, gen: () => string, baseMs: number) {
  const loop = () => {
    appendLine(out, gen());
    const ms = baseMs / (1 + intensity * 2.5) + Math.random() * baseMs * 0.6;
    setTimeout(loop, ms);
  };
  loop();
}

const FLAGS = ['S', 'S.', 'P.', '.', 'F.', 'R'];
const PROTO = ['https', 'ssh', 'dns', 'mqtt', 'pizza', 'quic', 'rtsp'];

function snifferLine(): string {
  const src = `${fakeIp()}.${randInt(1024, 65535)}`;
  const dst = `${fakeIp(false)}.${pick([22, 53, 80, 443, 1337, 8080])}`;
  const flag = pick(FLAGS);
  const r = Math.random();
  if (r < 0.08) return `<span class="c-warn">[!] pacchetto sospetto: contiene la parola "pizza"</span>`;
  if (r < 0.14) return `<span class="c-ok">[+] handshake catturato ${randHex(4)}…${randHex(2)}</span>`;
  return `<span class="c-dim">${clock(true)}</span> IP ${src} &gt; ${dst}: <span class="c-info">${pick(PROTO)}</span> [${flag}] len ${randInt(40, 1500)}`;
}

let hexAddr = 0x7ffe0000;
function sysLine(): string {
  const r = Math.random();
  if (r < 0.55) {
    hexAddr += 16;
    const bytes = randHex(16, ' ');
    const ascii = Array.from({ length: 16 }, () => String.fromCharCode(randInt(33, 126)))
      .join('')
      .replace(/[<>&]/g, '.');
    return `<span class="c-dim">${hex(hexAddr, 8)}</span>  ${bytes}  <span class="c-ok">${escapeHtml(ascii)}</span>`;
  }
  return pick([
    `<span class="c-info">kernel:</span> mainframe0: link up, ${pick([100, 1000, 10000])} Mbps`,
    `<span class="c-info">sshd[${randInt(200, 9999)}]:</span> Accepted publickey for root from ${fakeIp(false)}`,
    `<span class="c-warn">firewall:</span> DROP IN=eth0 SRC=${fakeIp(false)} DPT=${randInt(1, 9999)}`,
    `<span class="c-info">cron:</span> (root) CMD (prepara_caffe.sh --forte)`,
    `<span class="c-ok">satellite:</span> uplink ${randInt(60, 99)}% · orbita bassa · nonna online`,
    `<span class="c-info">nmap:</span> ${fakeIp()} ${randInt(1, 9000)}/tcp open ${pick(PROTO)}`,
  ]);
}

// ---------------------------------------------------------------------------

export class ConsoleTerm {
  root!: HTMLElement;
  private out!: HTMLElement;
  private input!: HTMLInputElement;
  private promptEl!: HTMLElement;
  private history: string[] = [];
  private histIdx = -1;
  onCommand: (text: string) => void = () => {};
  onKey: () => void = () => {};
  completions: () => string[] = () => [];

  mount(container: HTMLElement) {
    const t = makeTerm('root@mainframe — zsh', 'terminal', 'console');
    this.root = t.root;
    this.out = t.out;
    this.root.querySelector('.live')!.textContent = '';
    const line = el('div', 'prompt-line');
    this.promptEl = el('span', 'prompt');
    this.input = el('input');
    this.input.spellcheck = false;
    this.input.autocomplete = 'off';
    line.append(this.promptEl, this.input);
    this.root.append(line);
    container.append(this.root);
    this.updatePrompt();
    bus.on('settings', () => this.updatePrompt());

    this.root.addEventListener('mousedown', (e) => {
      if (e.target !== this.input) {
        e.preventDefault();
        this.focus();
      }
    });
    this.input.addEventListener('focus', () => {
      this.root.classList.add('focused');
      bus.emit('focus', 'console');
    });
    this.input.addEventListener('blur', () => this.root.classList.remove('focused'));
    this.input.addEventListener('keydown', (e) => this.handleKey(e));
  }

  private updatePrompt() {
    this.promptEl.innerHTML = `${promptUser()}@mainframe:<span class="path">~/operazione</span>$`;
  }

  private promptHtml() {
    return `<span class="prompt">${this.promptEl.innerHTML}</span>`;
  }

  private handleKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const text = this.input.value;
      this.input.value = '';
      this.submit(text);
      return;
    }
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!this.history.length) return;
      this.histIdx =
        e.key === 'ArrowUp'
          ? Math.max(0, (this.histIdx < 0 ? this.history.length : this.histIdx) - 1)
          : Math.min(this.history.length, this.histIdx + 1);
      this.input.value = this.history[this.histIdx] ?? '';
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      this.complete();
      return;
    }
    if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      this.clear();
      return;
    }
    if (e.key.length === 1 || e.key === 'Backspace') this.onKey();
  }

  private submit(text: string) {
    appendLine(this.out, `${this.promptHtml()} ${escapeHtml(text)}`, 400);
    if (text.trim()) {
      this.history.push(text);
      if (this.history.length > 50) this.history.shift();
    }
    this.histIdx = -1;
    this.scroll();
    this.onCommand(text);
  }

  private complete() {
    const value = this.input.value;
    const parts = value.split(' ');
    const last = parts[parts.length - 1].toLowerCase();
    if (!last) return;
    const match = this.completions().find((w) => w.toLowerCase().startsWith(last));
    if (match) {
      parts[parts.length - 1] = match;
      this.input.value = parts.join(' ') + ' ';
    }
  }

  focus() {
    this.input.focus();
  }

  get focused() {
    return document.activeElement === this.input;
  }

  print(text: string, cls = '') {
    const line = appendLine(this.out, cls ? `<span class="${cls}">${escapeHtml(text)}</span>` : escapeHtml(text), 400);
    this.scroll();
    return line;
  }

  printHtml(html: string) {
    const line = appendLine(this.out, html, 400);
    this.scroll();
    return line;
  }

  /** Scrive una riga lettera per lettera, come nei film. */
  async typeOut(text: string, cls = '', cps = 90) {
    const line = this.printHtml('');
    const span = el('span', cls);
    line.append(span);
    for (let i = 0; i < text.length; i++) {
      span.textContent += text[i];
      if (i % 2 === 0) await sleep(1000 / cps);
    }
    this.scroll();
  }

  /** Riga con barra di avanzamento testuale. */
  progress(label: string) {
    const line = this.printHtml('');
    const set = (p: number, extra = '') => {
      const width = 24;
      const full = Math.round((p / 100) * width);
      line.innerHTML = `${escapeHtml(label)} <span class="bar">[${'█'.repeat(full)}${'░'.repeat(width - full)}]</span> ${String(Math.round(p)).padStart(3)}% <span class="c-dim">${escapeHtml(extra)}</span>`;
      this.scroll();
    };
    set(0);
    return set;
  }

  clear() {
    this.out.innerHTML = '';
  }

  /** Usato dall'autopilota: scrive un comando nell'input e lo invia. */
  async typeCommand(text: string) {
    this.input.value = '';
    for (const ch of text) {
      this.input.value += ch;
      this.onKey();
      await sleep(40 + Math.random() * 70);
    }
    await sleep(250);
    this.input.value = '';
    this.submit(text);
  }

  private scroll() {
    this.out.scrollTop = this.out.scrollHeight;
  }
}

export const consoleTerm = new ConsoleTerm();

export function mountTerminals(container: HTMLElement) {
  const sniff = makeTerm('sniffer — tcpdump', 'pulse');
  const sys = makeTerm('syslog — mainframe0', 'server');
  container.append(sniff.root, sys.root);
  startLogTerm(sniff.out, snifferLine, 420);
  startLogTerm(sys.out, sysLine, 360);
  consoleTerm.mount(container);
}
