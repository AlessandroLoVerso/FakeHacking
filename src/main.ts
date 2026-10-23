// Punto di ingresso: costruisce l'interfaccia, collega tastiera e comandi.
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/jetbrains-mono/800.css';
import '@vscode/codicons/dist/codicon.css';
import './styles/main.css';

import { bus } from './core/bus';
import { getSettings, updateSettings, type Settings } from './core/settings';
import { sfx } from './core/sfx';
import { abortAll, pick, randInt, sleep } from './core/util';
import { NOTIFICATIONS } from './data/funny';
import { autopilot } from './engine/autopilot';
import { COMPLETIONS, parseCommand } from './engine/commands';
import { game } from './engine/game';
import { runCommand, runKind } from './engine/sequences';
import { runBoot } from './ui/boot';
import { bossKey } from './ui/boss';
import { devicesPanel } from './ui/devices';
import { editor } from './ui/editor';
import { buildLayout } from './ui/layout';
import { mountMapPanel } from './ui/mapPanel';
import {
  accessDenied,
  accessGranted,
  alarmOn,
  clearOverlays,
  closeAllWindows,
  setAlarm,
  toast,
} from './ui/overlays';
import { settingsPanel } from './ui/settingsPanel';
import { mountSidebar } from './ui/sidebar';
import { mountActivityBar, mountStatusbar } from './ui/statusbar';
import { consoleTerm, mountTerminals } from './ui/terminals';

const layout = buildLayout(document.getElementById('app')!);

function applySettings(s: Settings) {
  document.documentElement.dataset.theme = s.theme;
  document.body.classList.toggle('crt', s.crt);
}
applySettings(getSettings());
bus.on('settings', applySettings);

editor.mount(layout.editor, layout.tabs, layout.breadcrumbs);
mountSidebar(layout.sidebar);
mountTerminals(layout.terminals);
devicesPanel.mount(layout.devicesPane);
mountMapPanel(layout.mapPane);
mountStatusbar(layout.statusbar, {
  help: () => void runCommand({ kind: 'help', raw: 'help' }),
  settings: () => settingsPanel.toggle(),
});

const OTHER_ACTIVITY: Record<string, string> = {
  Cerca: 'Gli hacker veri non cercano: trovano.',
  'Controllo sorgente': '3 modifiche non salvate: "piano_conquista_mondo.md" e due ricette.',
  'Esegui e debug': 'Il debug è per chi sbaglia. Noi non sbagliamo (quasi mai).',
  Estensioni: 'Estensione consigliata: "Caffè Infinito" ★★★★★',
  Sicurezza: 'Livello di sicurezza attuale: password sul post-it.',
};
mountActivityBar(layout.activity, {
  settings: () => settingsPanel.toggle(),
  onOther: (name) =>
    toast(OTHER_ACTIVITY[name] ?? `Connesso come ${getSettings().hackerName}@mainframe`, 'info', name),
});

// --- Console ----------------------------------------------------------------

const charsPerKey = () => Math.max(1, Math.round(getSettings().typingSpeed * 0.8 + Math.random() * 2 - 1));

consoleTerm.onCommand = (text) => {
  const cmd = parseCommand(text, devicesPanel.all());
  if (cmd.kind !== 'empty') game.addPoints(randInt(5, 15));
  void runCommand(cmd);
};
consoleTerm.onKey = () => {
  editor.type(Math.ceil(charsPerKey() / 2));
  sfx.key();
};
consoleTerm.completions = () => [...COMPLETIONS, ...devicesPanel.all().map((d) => d.name.toLowerCase())];
devicesPanel.onClick = (d) => void consoleTerm.typeCommand(`hack ${d.name.toLowerCase()}`);

// --- Tasti -------------------------------------------------------------------

const DIRECTOR: Record<string, () => void> = {
  '1': () => void accessGranted(),
  '2': () => void accessDenied(),
  '3': () => runKind('trace'),
  '4': () => {
    if (alarmOn()) return setAlarm(false);
    setAlarm(true, 6000);
    toast('ALLARME: intrusione rilevata nel mainframe', 'err', 'Sicurezza');
  },
  '5': () => runKind('matrix'),
  '6': () => runKind('hack'),
  '7': () => runKind('decrypt'),
  '8': () => runKind('download'),
  '9': () => autopilot.toggle(),
  '0': () => runKind('nuke'),
};

function escapeEverything() {
  abortAll();
  clearOverlays();
  closeAllWindows();
  for (const d of devicesPanel.all()) if (d.status === 'attack') devicesPanel.setStatus(d.id, 'online');
}

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen().catch(() => {});
}

let booting = false;

window.addEventListener('keydown', (e) => {
  if (booting) return;
  const mod = e.ctrlKey || e.metaKey;

  if (bossKey.on) {
    e.preventDefault();
    if ((mod && e.code === 'KeyB') || e.key === 'Escape') bossKey.toggle();
    return;
  }
  if (mod && e.code === 'KeyB') {
    e.preventDefault();
    bossKey.toggle();
    return;
  }
  if (mod && (e.key === ',' || e.code === 'Comma')) {
    e.preventDefault();
    settingsPanel.toggle();
    return;
  }
  if (e.key === 'Escape') {
    if (settingsPanel.open) settingsPanel.close();
    else escapeEverything();
    return;
  }
  if (e.key === 'F11') {
    e.preventDefault();
    toggleFullscreen();
    return;
  }
  const fKey = /^F(\d{1,2})$/.exec(e.key);
  if (fKey && Number(fKey[1]) <= 10) {
    e.preventDefault();
    DIRECTOR[fKey[1] === '10' ? '0' : fKey[1]]();
    return;
  }
  if (e.altKey && /^Digit\d$/.test(e.code)) {
    e.preventDefault();
    DIRECTOR[e.code.slice(5)]();
    return;
  }
  if (e.altKey && e.code === 'KeyM') {
    e.preventDefault();
    updateSettings({ sound: !getSettings().sound });
    return;
  }
  if (mod && e.code === 'Backquote') {
    e.preventDefault();
    consoleTerm.focus();
    return;
  }
  if (mod && e.code === 'KeyE') {
    e.preventDefault();
    layout.editor.focus();
    return;
  }
  if (settingsPanel.open || consoleTerm.focused || mod) return;

  // Modalità hackertyper: ogni tasto scrive codice nell'editor.
  if (e.key === 'Backspace') {
    e.preventDefault();
    editor.erase(charsPerKey());
    sfx.key();
  } else if (e.key.length === 1 || e.key === 'Enter' || e.key === 'Tab') {
    e.preventDefault();
    editor.type(charsPerKey());
    sfx.key();
    bus.emit('pulse', 0.05);
  }
});

// --- Notifiche casuali -------------------------------------------------------

async function notificationLoop() {
  await sleep(20000);
  for (;;) {
    await sleep(randInt(25000, 60000));
    const s = getSettings();
    if (!s.notifications || bossKey.on || !s.devices.length) continue;
    const device = pick(s.devices).name;
    const owners = s.devices.map((d) => /\b(?:di|del|della)\s+(.+)$/i.exec(d.name)?.[1]).filter(Boolean) as string[];
    const owner = owners.length ? pick(owners) : s.hackerName;
    const msg = pick(NOTIFICATIONS).replace('{device}', device).replace('{owner}', owner);
    toast(msg, pick(['info', 'info', 'warn']), pick(['Mainframe', 'Sniffer', 'Satellite', 'Rete']));
  }
}

// --- Avvio -------------------------------------------------------------------

async function start() {
  consoleTerm.print(`Mainframe 1.0 — sistema pronto. Benvenuto, ${getSettings().hackerName}.`, 'c-ok');
  consoleTerm.print('Scrivi qualcosa e premi Invio. "help" per i comandi, F9 per l\'autopilota.', 'c-dim');
  if (getSettings().boot) {
    booting = true;
    await runBoot();
    booting = false;
  }
  consoleTerm.focus();
  void notificationLoop();
}

void start();
