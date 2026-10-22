// Barra di stato blu in basso, come in VS Code.
import { bus } from '../core/bus';
import { getSettings, updateSettings } from '../core/settings';
import { clock, el, icon } from '../core/util';
import { game } from '../engine/game';

export function mountStatusbar(bar: HTMLElement, actions: { help(): void; settings(): void }) {
  bar.innerHTML = `
    <span class="item remote">${icon('remote')} SSH: mainframe</span>
    <span class="item">${icon('git-branch')} main*</span>
    <span class="item">${icon('sync')} 0↓ 1337↑</span>
    <span class="item">${icon('error')} 0 ${icon('warning')} 3</span>
    <span class="item" data-ref="points"></span>
    <span class="item auto" data-ref="auto" hidden>${icon('rocket')} AUTOPILOTA</span>
    <span class="spacer"></span>
    <span class="item" data-ref="cursor">Ln 1, Col 1</span>
    <span class="item">Spazi: 4</span>
    <span class="item">UTF-8</span>
    <span class="item" data-ref="lang">Python</span>
    <span class="item click" data-ref="sound"></span>
    <span class="item click" data-ref="help">${icon('question')} Comandi</span>
    <span class="item click" data-ref="gear">${icon('settings-gear')}</span>
    <span class="item"><span class="rec">●</span> REC</span>
    <span class="item" data-ref="clock"></span>
    <span class="item">${icon('bell')}</span>`;
  const ref = (n: string) => bar.querySelector<HTMLElement>(`[data-ref="${n}"]`)!;

  const points = ref('points');
  const renderPoints = () => {
    points.innerHTML = `${icon('flame')} Livello hacker: ${game.points.toLocaleString('it-IT')}`;
  };
  renderPoints();
  bus.on('points', renderPoints);

  bus.on('cursor', (c) => {
    ref('cursor').textContent = `Ln ${c.line}, Col ${c.col}`;
    ref('lang').textContent = c.lang;
  });

  bus.on('autopilot', (on) => (ref('auto').hidden = !on));

  const sound = ref('sound');
  const renderSound = () => {
    sound.innerHTML = icon(getSettings().sound ? 'unmute' : 'mute');
    sound.title = getSettings().sound ? 'Suoni accesi (Alt+M)' : 'Suoni spenti (Alt+M)';
  };
  renderSound();
  bus.on('settings', renderSound);
  sound.addEventListener('click', () => updateSettings({ sound: !getSettings().sound }));

  ref('help').addEventListener('click', actions.help);
  ref('gear').addEventListener('click', actions.settings);

  const clk = ref('clock');
  const tick = () => (clk.textContent = clock());
  tick();
  setInterval(tick, 1000);
}

/** Icone dell'activity bar a sinistra. */
export function mountActivityBar(bar: HTMLElement, actions: { settings(): void; onOther(name: string): void }) {
  const items: [string, string, string?][] = [
    ['files', 'Explorer'],
    ['search', 'Cerca'],
    ['source-control', 'Controllo sorgente', '3'],
    ['debug-alt', 'Esegui e debug'],
    ['extensions', 'Estensioni', '1'],
    ['shield', 'Sicurezza'],
  ];
  items.forEach(([name, title, badge], i) => {
    const a = el('div', `act${i === 0 ? ' active' : ''}`, `${icon(name)}${badge ? `<span class="badge">${badge}</span>` : ''}`);
    a.title = title;
    if (i > 0) a.addEventListener('click', () => actions.onOther(title));
    bar.append(a);
  });
  bar.append(el('div', 'spacer'));
  const account = el('div', 'act', icon('account'));
  account.title = 'Account';
  account.addEventListener('click', () => actions.onOther('Account'));
  const gear = el('div', 'act', icon('settings-gear'));
  gear.title = 'Impostazioni (Ctrl+,)';
  gear.addEventListener('click', actions.settings);
  bar.append(account, gear);
}
