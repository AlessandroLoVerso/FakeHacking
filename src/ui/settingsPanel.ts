// Finestra impostazioni in stile VS Code. Ogni modifica si salva subito.
import { getSettings, resetSettings, updateSettings, type Theme } from '../core/settings';
import { el, escapeHtml, icon } from '../core/util';
import { DEVICE_TYPES, type DeviceType } from '../data/devices';

let backdrop: HTMLElement | null = null;

export const settingsPanel = {
  get open() {
    return backdrop !== null;
  },
  toggle() {
    if (backdrop) this.close();
    else this.show();
  },
  close() {
    backdrop?.remove();
    backdrop = null;
  },
  show() {
    backdrop = el('div', 'modal-backdrop');
    const box = el('div', 'settings');
    backdrop.append(box);
    backdrop.addEventListener('mousedown', (e) => {
      if (e.target === backdrop) this.close();
    });
    document.body.append(backdrop);
    render(box);
  },
};

function render(box: HTMLElement) {
  const s = getSettings();
  const typeOptions = (sel: DeviceType) =>
    (Object.keys(DEVICE_TYPES) as DeviceType[])
      .map((t) => `<option value="${t}"${t === sel ? ' selected' : ''}>${DEVICE_TYPES[t].label}</option>`)
      .join('');

  box.innerHTML = `
    <header>${icon('settings-gear')} Impostazioni <span class="c-dim">— salvate automaticamente</span><i class="codicon codicon-close x"></i></header>
    <div class="body">
      <div class="setting">
        <div class="name">Hacker: <span>Nome</span></div>
        <div class="desc">Compare nel prompt della console e nei messaggi.</div>
        <input type="text" data-k="hackerName" maxlength="24" value="${escapeHtml(s.hackerName)}">
      </div>
      <div class="setting">
        <div class="name">Aspetto: <span>Tema</span></div>
        <select data-k="theme">
          <option value="dark"${s.theme === 'dark' ? ' selected' : ''}>Scuro (stile VS Code)</option>
          <option value="green"${s.theme === 'green' ? ' selected' : ''}>Verde hacker</option>
          <option value="red"${s.theme === 'red' ? ' selected' : ''}>Allarme rosso</option>
        </select>
      </div>
      <div class="setting">
        <div class="name">Editor: <span>Velocità di scrittura</span></div>
        <div class="desc">Quanti caratteri di codice compaiono per ogni tasto premuto.</div>
        <input type="range" min="1" max="10" step="1" data-k="typingSpeed" value="${s.typingSpeed}">
      </div>
      <div class="setting">
        <div class="name">Audio</div>
        <label class="check"><input type="checkbox" data-k="sound"${s.sound ? ' checked' : ''}> Suoni attivi (Alt+M)</label>
        <div class="desc" style="margin-top:.5rem">Volume</div>
        <input type="range" min="0" max="100" step="5" data-k="volume" value="${s.volume}">
      </div>
      <div class="setting">
        <div class="name">Effetti</div>
        <label class="check"><input type="checkbox" data-k="crt"${s.crt ? ' checked' : ''}> Effetto vecchio monitor (scanline CRT)</label>
        <label class="check"><input type="checkbox" data-k="boot"${s.boot ? ' checked' : ''}> Sequenza di avvio all'apertura</label>
        <label class="check"><input type="checkbox" data-k="notifications"${s.notifications ? ' checked' : ''}> Notifiche buffe casuali</label>
      </div>
      <div class="setting">
        <div class="name">Dispositivi in rete</div>
        <div class="desc">Metti i nomi dei tuoi amici: in console potrai scrivere per esempio "hack telefono di Marco".</div>
        <div class="dev-rows">
          ${s.devices
            .map(
              (d) => `<div class="dev-row" data-id="${d.id}">
                <input type="text" maxlength="40" value="${escapeHtml(d.name)}">
                <select>${typeOptions(d.type)}</select>
                <button class="btn icon" title="Rimuovi">${icon('trash')}</button>
              </div>`,
            )
            .join('')}
        </div>
        <div class="actions"><button class="btn secondary" data-act="add">${icon('add')} Aggiungi dispositivo</button></div>
      </div>
      <div class="setting">
        <div class="name">Tasti da regista</div>
        <div class="keys">
          <kbd>F1 / Alt+1</kbd><span>ACCESS GRANTED</span>
          <kbd>F2 / Alt+2</kbd><span>ACCESS DENIED</span>
          <kbd>F3 / Alt+3</kbd><span>Tracciamento sulla mappa</span>
          <kbd>F4 / Alt+4</kbd><span>Allarme rosso</span>
          <kbd>F5 / Alt+5</kbd><span>Matrix</span>
          <kbd>F6 / Alt+6</kbd><span>Attacco a un dispositivo a caso</span>
          <kbd>F7 / Alt+7</kbd><span>Decifra password</span>
          <kbd>F8 / Alt+8</kbd><span>Download segreto</span>
          <kbd>F9 / Alt+9</kbd><span>Autopilota</span>
          <kbd>F10 / Alt+0</kbd><span>Autodistruzione</span>
          <kbd>Ctrl+B</kbd><span>Tasto capo</span>
          <kbd>Ctrl+\`</kbd><span>Console</span>
          <kbd>Ctrl+E</kbd><span>Editor (modalità hackertyper)</span>
          <kbd>F11</kbd><span>Schermo intero</span>
          <kbd>Esc</kbd><span>Chiude finestre ed effetti</span>
        </div>
      </div>
      <div class="actions">
        <button class="btn secondary" data-act="reset">Ripristina predefiniti</button>
        <button class="btn" data-act="close">Fatto</button>
      </div>
    </div>`;

  box.querySelector('.x')!.addEventListener('click', () => settingsPanel.close());
  box.querySelector('[data-act="close"]')!.addEventListener('click', () => settingsPanel.close());
  box.querySelector('[data-act="reset"]')!.addEventListener('click', () => {
    resetSettings();
    render(box);
  });

  box.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-k]').forEach((input) => {
    input.addEventListener('input', () => {
      const k = input.dataset.k!;
      if (input instanceof HTMLInputElement && input.type === 'checkbox') updateSettings({ [k]: input.checked });
      else if (input instanceof HTMLInputElement && input.type === 'range') updateSettings({ [k]: Number(input.value) });
      else if (k === 'theme') updateSettings({ theme: input.value as Theme });
      else updateSettings({ [k]: input.value });
    });
  });

  const saveDevices = () => {
    const devices = [...box.querySelectorAll<HTMLElement>('.dev-row')].map((row) => ({
      id: row.dataset.id!,
      name: row.querySelector('input')!.value.trim() || 'Dispositivo senza nome',
      type: row.querySelector('select')!.value as DeviceType,
    }));
    updateSettings({ devices });
  };
  box.querySelectorAll<HTMLElement>('.dev-row').forEach((row) => {
    row.querySelector('input')!.addEventListener('change', saveDevices);
    row.querySelector('select')!.addEventListener('change', saveDevices);
    row.querySelector('button')!.addEventListener('click', () => {
      row.remove();
      saveDevices();
    });
  });
  box.querySelector('[data-act="add"]')!.addEventListener('click', () => {
    const devices = [...getSettings().devices, { id: `u${Date.now()}`, name: 'Telefono di …', type: 'phone' as DeviceType }];
    updateSettings({ devices });
    render(box);
    const inputs = box.querySelectorAll<HTMLInputElement>('.dev-row input');
    inputs[inputs.length - 1]?.select();
  });
}
