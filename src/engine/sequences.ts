// Le scene da film che partono quando premi Invio in console.
import { bus } from '../core/bus';
import { getSettings } from '../core/settings';
import { sfx } from '../core/sfx';
import {
  Aborted,
  chance,
  createRun,
  el,
  escapeHtml,
  fakeIp,
  formatNumber,
  pick,
  rand,
  randHex,
  randInt,
  shuffle,
  sleep,
  type Run,
} from '../core/util';
import { ITALIAN_CITIES, WORLD_CITIES } from '../data/cities';
import { DEVICE_TYPES } from '../data/devices';
import { ADDRESSES, DOWNLOAD_FILES, FIREWALL_LAYERS, FUN_FILES, PASSWORDS, TRACE_TARGETS } from '../data/funny';
import { devicesPanel, type Device } from '../ui/devices';
import { editor } from '../ui/editor';
import { WorldMap } from '../ui/map';
import { sideMap } from '../ui/mapPanel';
import {
  accessDenied,
  accessGranted,
  banner,
  countdownOverlay,
  flash,
  joke,
  matrix,
  openWindow,
  setAlarm,
  shake,
  toast,
} from '../ui/overlays';
import { consoleTerm as con } from '../ui/terminals';
import type { Command, CommandKind } from './commands';
import { game } from './game';

const pulse = (n = 0.6) => bus.emit('pulse', n);
const pour = (min = 20, max = 60) => editor.type(randInt(min, max));

export async function runCommand(cmd: Command) {
  const run = createRun();
  try {
    await dispatch(cmd.kind, run, cmd);
  } catch (e) {
    if (!(e instanceof Aborted)) throw e;
  }
}

/** Lancia una scena da tastiera (tasti del regista) senza passare dalla console. */
export function runKind(kind: CommandKind) {
  void runCommand({ kind, raw: '' });
}

async function dispatch(kind: CommandKind, run: Run, cmd: Command) {
  switch (kind) {
    case 'empty':
      return;
    case 'help':
      return help();
    case 'clear':
      return con.clear();
    case 'whoami':
      return whoami();
    case 'ls':
      return ls();
    case 'sudo':
      return sudo(run);
    case 'exit':
      return con.print('Non si esce dal mainframe. È il mainframe che esce da te.', 'c-warn');
    case 'coffee':
      return coffee(run);
    case 'hack':
      return hack(run, cmd.deviceId);
    case 'trace':
      return trace(run, cmd.deviceId, cmd.raw);
    case 'decrypt':
      return decrypt(run, cmd.deviceId);
    case 'download':
      return download(run);
    case 'firewall':
      return firewall(run);
    case 'scan':
      return scan(run);
    case 'matrix':
      return enterMatrix(run);
    case 'nuke':
      return nuke(run);
    case 'custom':
      return custom(run, cmd.raw);
  }
}

// --- Elenco di passi con stato ---------------------------------------------

function addStep(list: HTMLElement, text: string) {
  const row = el('div', 'step', `<span class="st c-warn">[ .. ]</span><span>${escapeHtml(text)}</span>`);
  list.append(row);
  while (list.childElementCount > 9) list.firstElementChild!.remove();
  const st = row.querySelector('.st')!;
  return {
    ok() {
      st.className = 'st c-ok';
      st.textContent = '[ OK ]';
    },
    fail() {
      st.className = 'st c-err';
      st.textContent = '[FAIL]';
    },
  };
}

// --- Attacco a un dispositivo ----------------------------------------------

async function hack(run: Run, deviceId?: string) {
  const d: Device | undefined =
    devicesPanel.get(deviceId) ?? devicesPanel.random((x) => x.status === 'online') ?? devicesPanel.random();
  if (!d) {
    con.print('[!] Nessun dispositivo disponibile. Prova "scan".', 'c-warn');
    return;
  }
  if (d.status === 'attack') {
    con.print(`[!] ${d.name} è già sotto attacco. Pazienza, giovane hacker.`, 'c-warn');
    return;
  }
  const info = DEVICE_TYPES[d.type];
  if (d.status === 'pwned') con.print(`[i] ${d.name} è già nostro. Rientro per sport.`, 'c-dim');
  con.print(`[*] Bersaglio agganciato: ${d.name} (${d.ip})`, 'c-info');
  devicesPanel.setStatus(d.id, 'attack');
  sideMap()?.ping(pick(ITALIAN_CITIES), sideMap()!.color('warn'), 30);

  const win = openWindow({ title: `EXPLOIT › ${d.name}`, icon: 'bug', w: 580, h: 380 });
  win.body.innerHTML = `<div class="c-dim">target ${d.ip} · mac ${d.mac} · ${escapeHtml(info.label)}</div><div class="progress"><i></i></div><div class="steps"></div>`;
  const bar = win.body.querySelector<HTMLElement>('.progress > i')!;
  const steps = win.body.querySelector<HTMLElement>('.steps')!;
  const all = [
    `Scansione porte su ${d.ip}`,
    `Porta aperta: ${info.port}`,
    ...info.steps,
    'Iniezione payload pizza.bin',
    'Escalation privilegi → root',
  ];
  const denyAt = chance(0.35) ? randInt(2, all.length - 2) : -1;

  try {
    for (let i = 0; i < all.length; i++) {
      const s = addStep(steps, all[i]);
      pulse();
      pour();
      sfx.blip();
      await run.sleep(randInt(450, 900));
      if (i === denyAt) {
        s.fail();
        void accessDenied('contromisura rilevata');
        con.print('[!] Contromisura rilevata. Riprovo con più potenza (e più caffè)…', 'c-err');
        await run.sleep(2400);
        const retry = addStep(steps, 'Secondo tentativo con caffè doppio');
        await run.sleep(700);
        retry.ok();
      } else {
        s.ok();
      }
      con.print(`    [+] ${all[i]}`, 'c-ok');
      const pct = ((i + 1) / all.length) * 100;
      bar.style.width = `${pct}%`;
      devicesPanel.setProgress(d.id, pct);
    }
  } catch (e) {
    devicesPanel.setStatus(d.id, 'online');
    throw e;
  }

  devicesPanel.setStatus(d.id, 'pwned');
  game.addPoints(100);
  if (d.type === 'phone') game.complete('phone');
  void accessGranted(d.name.toUpperCase());
  con.print(`[+] ${d.name}: accesso root ottenuto`, 'c-ok');
  await run.sleep(1500);

  win.setTitle(`DATI ESTRATTI › ${d.name}`);
  win.body.innerHTML = '<table class="loot"></table>';
  const table = win.body.querySelector('table')!;
  for (const [k, v] of info.loot()) {
    const tr = el('tr', '', `<td>${escapeHtml(k)}</td><td>${escapeHtml(v)}</td>`);
    table.append(tr);
    sfx.tick();
    await run.sleep(380);
  }
  toast(`${d.name} è nostro. Usalo con saggezza.`, 'ok', 'Exploit');
  win.closeAfter(9000);
}

// --- Tracciamento sulla mappa ----------------------------------------------

/** "trova chi ha finito il caffè" → "Chi ha finito il caffè". */
function traceSubject(raw: string): string | undefined {
  const rest = raw.trim().split(/\s+/).slice(1).join(' ').replace(/^(--?\S+\s*)+/, '').trim();
  if (rest.length < 3) return undefined;
  const short = rest.length > 40 ? `${rest.slice(0, 40)}…` : rest;
  return short[0].toUpperCase() + short.slice(1);
}

async function trace(run: Run, deviceId?: string, raw = '') {
  const d = devicesPanel.get(deviceId);
  const who = d ? d.name : (traceSubject(raw) ?? pick(TRACE_TARGETS));
  con.print(`[*] Avvio tracciamento globale: ${who}`, 'c-info');

  const win = openWindow({ title: `GLOBAL TRACE › ${who}`, icon: 'globe', w: 940, h: 540 });
  win.body.innerHTML = '<div class="trace-layout"><canvas></canvas><div class="trace-log"></div></div>';
  const map = new WorldMap(win.body.querySelector('canvas')!, false);
  win.onClose(() => map.destroy());
  const logEl = win.body.querySelector<HTMLElement>('.trace-log')!;
  const log = (html: string) => {
    const line = el('div', '', html);
    logEl.append(line);
    while (logEl.childElementCount > 26) logEl.firstElementChild!.remove();
    return line;
  };

  const hops = shuffle(WORLD_CITIES).slice(0, randInt(4, 6));
  const final = pick(ITALIAN_CITIES);
  const warn = map.color('warn');
  const err = map.color('err');
  let prev = hops[0];
  map.ping(prev);
  log(`<span class="c-info">ORIGINE</span> ${prev.name} · ${fakeIp(false)}`);
  await run.sleep(500);
  for (let i = 1; i < hops.length; i++) {
    const h = hops[i];
    pulse();
    sfx.blip();
    await map.arc(prev, h, 750, warn);
    map.ping(h, warn);
    map.label(h, `PROXY #${i} ${h.name.toUpperCase()}`, 2200, warn);
    log(`<span class="c-warn">PROXY #${i}</span> ${h.name} · ${randInt(12, 280)}ms`);
    con.print(`    rimbalzo ${i}: ${h.name} (${fakeIp(false)})`, 'c-dim');
    sideMap()?.arc(prev, h, 750, warn);
    prev = h;
    if (!run.alive()) throw new Aborted();
  }
  log('<span class="c-ok">catena di proxy risolta</span>');
  log('aggancio segnale…');
  await map.arc(prev, final, 1200, err);
  map.ping(final, err, 50);
  sideMap()?.ping(final, err, 40);
  await run.sleep(300);
  await map.focus(final.lon, final.lat, 7, 1800);
  log('triangolazione con 3 torri cellulari…');
  const coords = log('');
  const tri = map.triangulate(final, 3000);
  for (let digits = 0; digits <= 5; digits++) {
    const j = (5 - digits) * 0.4;
    coords.innerHTML = `<span class="c-bright">LAT ${(final.lat + rand(-j, j)).toFixed(digits)} · LON ${(final.lon + rand(-j, j)).toFixed(digits)}</span>`;
    sfx.tick();
    pour(10, 30);
    await run.sleep(500);
  }
  await tri;
  const addr = `${pick(ADDRESSES)}, ${final.name}`;
  map.label(final, 'BERSAGLIO', 60000, err);
  log(`<span class="c-err">BERSAGLIO: ${escapeHtml(addr)}</span>`);
  void banner('TARGET LOCATED', 'warn', addr.toUpperCase());
  con.print(`[+] ${who} localizzato: ${addr} (${final.lat.toFixed(5)}, ${final.lon.toFixed(5)})`, 'c-ok');
  con.print(
    `    Dettaglio: ${pick(['terzo piano, citofono "Nonna"', 'sul divano, in pigiama', 'in fila alla posta', 'davanti al frigo aperto', 'in bagno da 20 minuti'])}`,
    'c-dim',
  );
  game.addPoints(150);
  game.complete('trace');
  win.closeAfter(11000);
}

// --- Decifratura -----------------------------------------------------------

async function decrypt(run: Run, deviceId?: string) {
  const d = devicesPanel.get(deviceId);
  const pwd = pick(PASSWORDS);
  con.print(`[*] Avvio bruteforce quantistico${d ? ` su ${d.name}` : ''}…`, 'c-info');
  const win = openWindow({ title: 'DECRYPT › AES-4096 (molto sicuro)', icon: 'key', w: 640, h: 330 });
  win.body.innerHTML = `
    <div class="c-dim">hash: ${randHex(24).toLowerCase()}…</div>
    <div class="slots"></div>
    <div>Tentativi: <b class="att c-warn">0</b> · <span class="c-dim">${randInt(80, 999)} Thash/s</span></div>
    <div class="progress"><i></i></div>`;
  const slots = win.body.querySelector<HTMLElement>('.slots')!;
  const att = win.body.querySelector<HTMLElement>('.att')!;
  const bar = win.body.querySelector<HTMLElement>('.progress > i')!;
  const cells = [...pwd].map(() => {
    const s = el('span');
    slots.append(s);
    return s;
  });
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789!?#$%&';
  let locked = 0;
  let attempts = 0;
  const spin = setInterval(() => {
    for (let i = locked; i < cells.length; i++) cells[i].textContent = chars[randInt(0, chars.length - 1)];
    attempts += randInt(40_000, 900_000);
    att.textContent = formatNumber(attempts);
  }, 50);
  win.onClose(() => clearInterval(spin));
  try {
    await run.sleep(700);
    for (let i = 0; i < pwd.length; i++) {
      await run.sleep(randInt(160, 480));
      cells[i].textContent = pwd[i];
      cells[i].classList.add('locked');
      locked = i + 1;
      bar.style.width = `${(locked / pwd.length) * 100}%`;
      sfx.tick();
      pulse(0.3);
      pour(5, 20);
    }
  } finally {
    clearInterval(spin);
  }
  win.body.querySelector('.progress')!.classList.add('ok');
  void banner('PASSWORD CRACKED', 'ok', pwd);
  con.print(`[+] Password${d ? ` di ${d.name}` : ''}: ${pwd}`, 'c-ok');
  con.print(
    `    ${pick([
      'Sicurezza: 2/10. La nonna ha fatto meglio.',
      "L'avevamo indovinata al secondo tentativo, ma così fa più scena.",
      'Consiglio: cambiarla. Suggerimento: non "password124".',
      'Tempo impiegato: meno di un caffè.',
    ])}`,
    'c-dim',
  );
  game.addPoints(120);
  game.complete('decrypt');
  win.closeAfter(7000);
}

// --- Download --------------------------------------------------------------

async function download(run: Run) {
  const files = shuffle(DOWNLOAD_FILES).slice(0, randInt(3, 4));
  con.print(`[*] Esfiltrazione di ${files.length} file in corso…`, 'c-info');
  const win = openWindow({ title: 'EXFILTRATION › download in corso', icon: 'cloud-download', w: 620, h: 90 + files.length * 64 });
  const rows = files.map((name) => {
    const row = el(
      'div',
      'dl-row',
      `<div class="meta"><span>${escapeHtml(name)}</span><span class="speed"></span></div><div class="progress"><i></i></div>`,
    );
    win.body.append(row);
    return {
      name,
      row,
      p: 0,
      size: rand(0.3, 40),
      speed: pick(['999 TB/s', '3 piccioni/s', '12 GB/s', '56 kb/s… anzi, 80 GB/s', '1 floppy/ms', 'più veloce della luce']),
    };
  });
  while (rows.some((r) => r.p < 100)) {
    for (const r of rows) {
      if (r.p >= 100) continue;
      r.p = Math.min(100, r.p + rand(1, 7) / Math.sqrt(r.size / 4));
      r.row.querySelector<HTMLElement>('.progress > i')!.style.width = `${r.p}%`;
      r.row.querySelector('.speed')!.textContent =
        r.p >= 100 ? 'completato' : `${r.speed} · ${(r.size * (r.p / 100)).toFixed(1)}/${r.size.toFixed(1)} GB`;
      if (r.p >= 100) {
        r.row.querySelector('.progress')!.classList.add('ok');
        con.print(`    [+] ${r.name}`, 'c-ok');
        sfx.blip();
      }
    }
    pulse(0.25);
    if (chance(0.3)) pour(5, 15);
    await run.sleep(120);
  }
  con.print(`[+] ${files.length} file salvati in ~/bottino/`, 'c-ok');
  toast(pick(['Il tiramisù è nostro.', 'Bottino al sicuro. Nessuno sospetta niente.', 'Download completato. Ora serve un posto dove nasconderlo.']), 'ok', 'Exfiltration');
  game.addPoints(100);
  game.complete('download');
  win.closeAfter(5000);
}

// --- Firewall --------------------------------------------------------------

async function firewall(run: Run) {
  const layers = shuffle(FIREWALL_LAYERS).slice(0, 4);
  con.print(`[*] Attacco al firewall: ${layers.length} livelli di difesa`, 'c-info');
  const win = openWindow({ title: 'FIREWALL BREACH', icon: 'shield', w: 600, h: 330 });
  win.body.innerHTML = '<div class="fw-title c-bright"></div><div class="wall"></div><div class="steps"></div>';
  const title = win.body.querySelector<HTMLElement>('.fw-title')!;
  const wall = win.body.querySelector<HTMLElement>('.wall')!;
  const steps = win.body.querySelector<HTMLElement>('.steps')!;
  for (let li = 0; li < layers.length; li++) {
    title.textContent = `LIVELLO ${li + 1}/${layers.length} — ${layers[li]}`;
    wall.innerHTML = '';
    const bricks = Array.from({ length: 42 }, () => {
      const b = el('i');
      b.style.setProperty('--rot', `${randInt(-90, 90)}deg`);
      wall.append(b);
      return b;
    });
    const step = addStep(steps, `${layers[li]}`);
    await run.sleep(400);
    for (const b of shuffle(bricks)) {
      b.classList.add('hot');
      setTimeout(() => b.classList.add('gone'), 120);
      if (chance(0.25)) sfx.tick();
      await run.sleep(randInt(15, 45));
    }
    step.ok();
    con.print(`    [+] ${layers[li]}: BYPASSATO`, 'c-ok');
    shake();
    pulse(0.8);
    pour();
    await run.sleep(500);
  }
  title.textContent = 'TUTTE LE DIFESE SONO CADUTE';
  void accessGranted('FIREWALL BYPASSATO');
  game.addPoints(120);
  game.complete('firewall');
  win.closeAfter(5000);
}

// --- Scansione rete con radar -------------------------------------------------

async function scan(run: Run) {
  con.print('[*] Avvio scansione di 192.168.1.0/24…', 'c-info');
  const win = openWindow({ title: 'NETWORK SCAN › 192.168.1.0/24', icon: 'radio-tower', w: 680, h: 400 });
  win.body.innerHTML = '<div class="radar-layout"><canvas></canvas><div class="trace-log"></div></div>';
  const canvas = win.body.querySelector('canvas')!;
  const logEl = win.body.querySelector<HTMLElement>('.trace-log')!;
  const blips: { a: number; r: number; name: string; t: number }[] = [];
  let alive = true;
  win.onClose(() => (alive = false));
  const t0 = performance.now();
  const color = getComputedStyle(document.documentElement).getPropertyValue('--ok-strong').trim();
  const draw = (now: number) => {
    if (!alive) return;
    requestAnimationFrame(draw);
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== w * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }
    const ctx = canvas.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2;
    const cy = h / 2;
    const R = Math.min(w, h) / 2 - 6;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.35;
    for (let i = 1; i <= 4; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (R * i) / 4, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(cx - R, cy);
    ctx.lineTo(cx + R, cy);
    ctx.moveTo(cx, cy - R);
    ctx.lineTo(cx, cy + R);
    ctx.stroke();
    const ang = ((now - t0) / 1600) * Math.PI * 2;
    for (let k = 0; k < 30; k++) {
      ctx.globalAlpha = 0.25 * (1 - k / 30);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, R, ang - (k + 1) * 0.03, ang - k * 0.03);
      ctx.fillStyle = color;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.font = '11px "JetBrains Mono", monospace';
    for (const b of blips) {
      const age = (now - b.t) / 1000;
      const x = cx + Math.cos(b.a) * b.r * R;
      const y = cy + Math.sin(b.a) * b.r * R;
      ctx.globalAlpha = Math.max(0.35, 1 - age * 0.3);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(b.name, x + 7, y + 4);
    }
    ctx.globalAlpha = 1;
  };
  requestAnimationFrame(draw);
  const log = (html: string) => {
    logEl.append(el('div', '', html));
    while (logEl.childElementCount > 24) logEl.firstElementChild!.remove();
  };

  const shortName = (n: string) => (n.length > 16 ? `${n.slice(0, 15)}…` : n);
  for (const d of devicesPanel.all()) {
    await run.sleep(randInt(180, 380));
    blips.push({ a: rand(0, Math.PI * 2), r: rand(0.25, 0.92), name: shortName(d.name), t: performance.now() });
    log(`<span class="c-ok">${d.ip}</span> ${escapeHtml(d.name)}`);
    con.print(`    ${d.ip.padEnd(15)} ${DEVICE_TYPES[d.type].port.padEnd(22)} ${d.name}`, 'c-dim');
    sfx.blip();
    pulse(0.3);
  }
  const found = randInt(1, 2);
  for (let i = 0; i < found; i++) {
    await run.sleep(700);
    const nd = devicesPanel.discover();
    if (!nd) break;
    blips.push({ a: rand(0, Math.PI * 2), r: rand(0.3, 0.9), name: shortName(nd.name), t: performance.now() });
    log(`<span class="c-warn">NUOVO</span> ${escapeHtml(nd.name)}`);
    con.print(`    [NUOVO] ${nd.ip.padEnd(15)} ${nd.name}`, 'c-warn');
    toast(`Nuovo dispositivo in rete: ${nd.name}`, 'warn', 'Network scan');
    sfx.alert();
  }
  const total = devicesPanel.all().length;
  con.print(`[+] Scansione completata: ${total} host attivi, 1 frigorifero sospetto.`, 'c-ok');
  game.addPoints(80);
  game.complete('scan');
  win.closeAfter(6000);
}

// --- Matrix, autodistruzione e varie ---------------------------------------

async function enterMatrix(run: Run) {
  await con.typeOut(`Wake up, Neo… anzi, svegliati ${getSettings().hackerName}.`, 'c-ok', 40);
  await run.sleep(400);
  await matrix(7000);
  con.print('Segui il coniglio bianco. O almeno il Wi-Fi.', 'c-dim');
  game.complete('matrix');
}

const NUKE_LINES = [
  'Taglia il filo rosso!',
  '…o era il blu?',
  'Chi ha lasciato il gas acceso?',
  'Salvate il tiramisù!',
  'Avvisate la nonna!',
  'Qualcuno salvi la playlist',
  'Il Roomba sta scappando',
  'Non era questo il pulsante del caffè',
  'Ultime parole famose: "cosa fa questo?"',
  'Addio mondo crudele',
];

async function nuke(run: Run) {
  con.print('[!!!] SEQUENZA DI AUTODISTRUZIONE AVVIATA', 'c-err');
  setAlarm(true, 11500);
  const cd = countdownOverlay();
  try {
    for (let n = 10; n >= 1; n--) {
      cd.set(n, NUKE_LINES[10 - n]);
      shake();
      sfx.beep();
      pulse(1);
      pour();
      await run.sleep(1000);
    }
  } catch (e) {
    cd.remove();
    setAlarm(false);
    con.print('Autodistruzione annullata. Peccato, era il momento migliore.', 'c-warn');
    throw e;
  }
  cd.remove();
  setAlarm(false);
  flash();
  sfx.boom();
  shake();
  await joke('DISINNESCATA', 'Il mainframe ha deciso di vivere. Nessun frigorifero è stato maltrattato.');
  con.print('[i] Allarme rientrato. Il mainframe sta bene.', 'c-dim');
  game.complete('nuke');
}

async function custom(run: Run, raw: string) {
  const short = raw.length > 40 ? `${raw.slice(0, 40)}…` : raw;
  con.print(`[*] Compilo exploit personalizzato «${short}»`, 'c-info');
  const set = con.progress('    gcc -O3 exploit.c');
  for (let p = 0; p <= 100; p += randInt(6, 18)) {
    set(Math.min(100, p));
    pour(5, 15);
    await run.sleep(70);
  }
  set(100, 'fatto');
  con.print(
    `    ${pick([
      'Analisi: incomprensibile. Perfetto, nessuno capirà.',
      'Sintassi creativa rilevata. Il mainframe è confuso: ottimo.',
      'Errore 418: sono una teiera. Procedo comunque.',
      'Codice approvato dal comitato hacker (3 gatti).',
      'Compilato con 0 errori e 47 miracoli.',
    ])}`,
    'c-dim',
  );
  await run.sleep(400);
  const next: CommandKind = pick(['hack', 'hack', 'trace', 'decrypt', 'download', 'firewall', 'scan']);
  await dispatch(next, run, { kind: next, raw });
}

function help() {
  const rows: [string, string][] = [
    ['hack <dispositivo>', 'entra in un dispositivo (o cliccalo a destra)'],
    ['trace <qualcuno>', 'localizza qualcuno sulla mappa'],
    ['decrypt', 'decifra una password'],
    ['download', 'ruba file segretissimi'],
    ['firewall', 'sfonda le difese'],
    ['scan', 'cerca dispositivi nella rete'],
    ['matrix', '…lo sai'],
    ['nuke', 'non premere'],
    ['whoami · ls · sudo · caffè · clear', 'piccole sorprese'],
    ['testo a caso', 'diventa un exploit personalizzato'],
  ];
  con.printHtml('<span class="c-bright">COMANDI</span> <span class="c-dim">(funzionano anche dentro le frasi, es. "ok ora hackera il frigo")</span>');
  for (const [c, d] of rows) con.printHtml(`  <span class="c-kw">${escapeHtml(c.padEnd(36))}</span><span class="c-dim">${escapeHtml(d)}</span>`);
  con.printHtml('<span class="c-bright">TASTI DA REGISTA</span>');
  const keys: [string, string][] = [
    ['F1 / Alt+1', 'ACCESS GRANTED gigante'],
    ['F2 / Alt+2', 'ACCESS DENIED gigante'],
    ['F3…F8 / Alt+3…8', 'trace, allarme, matrix, hack, decrypt, download'],
    ['F9 / Alt+9', 'autopilota (va da solo)'],
    ['F10 / Alt+0', 'autodistruzione'],
    ['Ctrl+B', 'tasto capo (arriva qualcuno!)'],
    ['Ctrl+,', 'impostazioni (nomi dei dispositivi, tema…)'],
    ['Ctrl+` · Ctrl+E', 'vai alla console · vai all\'editor'],
    ['Alt+M · F11 · Esc', 'audio · schermo intero · chiudi tutto'],
  ];
  for (const [k, d] of keys) con.printHtml(`  <span class="c-warn">${escapeHtml(k.padEnd(36))}</span><span class="c-dim">${escapeHtml(d)}</span>`);
}

function whoami() {
  const s = getSettings();
  con.print(`${s.hackerName} — livello hacker ${game.points.toLocaleString('it-IT')}`, 'c-bright');
  con.print('Hacker certificato (corso online da 5 minuti, voto: 30 e lode).', 'c-dim');
}

function ls() {
  con.printHtml(
    FUN_FILES.map((f) => `<span class="${f.endsWith('.zip') || f.endsWith('.png') ? 'c-warn' : 'c-info'}">${escapeHtml(f)}</span>`).join('   '),
  );
}

async function sudo(run: Run) {
  const name = getSettings().hackerName.toLowerCase();
  await con.typeOut(`[sudo] password per ${name}: ********`, 'c-dim', 30);
  await run.sleep(600);
  con.print(`${name} non è nel file sudoers. L'incidente verrà segnalato alla nonna.`, 'c-err');
}

async function coffee(run: Run) {
  const cup = ['   ( (', '    ) )', '  ........', '  |      |]', '  \\      /', "   `----'"];
  for (const l of cup) {
    con.print(l, 'c-warn');
    await run.sleep(120);
  }
  con.print('Caffè erogato. +10 concentrazione, +3 tremolio alle mani.', 'c-ok');
  game.addPoints(10);
  await sleep(0);
}
