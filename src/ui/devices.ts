// Pannello "Dispositivi in rete": schede finte con IP, segnale, batteria e stato.
import { bus } from '../core/bus';
import { getSettings } from '../core/settings';
import { chance, el, escapeHtml, fakeIp, fakeMac, icon, pick, randInt } from '../core/util';
import { DEVICE_TYPES, DISCOVERABLE, type DeviceConfig } from '../data/devices';

export type DeviceStatus = 'online' | 'attack' | 'pwned' | 'offline';

export interface Device extends DeviceConfig {
  ip: string;
  mac: string;
  signal: number;
  battery: number | null;
  ping: number;
  status: DeviceStatus;
  discovered: boolean;
}

const BATTERY_TYPES = new Set(['phone', 'laptop', 'watch', 'robot']);
const SIGNAL = ['▂___', '▂▄__', '▂▄▆_', '▂▄▆█'];
const LABEL: Record<DeviceStatus, string> = {
  online: 'ONLINE',
  attack: 'ATTACCO',
  pwned: 'PWNED',
  offline: 'OFFLINE',
};

class DevicesPanel {
  private list!: HTMLElement;
  private countEl!: HTMLElement;
  private extraEl!: HTMLElement;
  private devices: Device[] = [];
  private cards = new Map<string, HTMLElement>();
  onClick: (d: Device) => void = () => {};

  mount(pane: HTMLElement) {
    pane.innerHTML = `<div class="pane-title">${icon('broadcast')} DISPOSITIVI IN RETE <span class="count"></span><span class="extra">192.168.1.0/24</span></div>`;
    this.countEl = pane.querySelector('.count')!;
    this.extraEl = pane.querySelector('.extra')!;
    this.list = el('div', 'device-list');
    pane.append(this.list);
    this.sync(getSettings().devices);
    bus.on('settings', (s) => this.sync(s.devices));
    setInterval(() => this.ambient(), 1500);
  }

  /** Allinea le schede alla lista delle impostazioni, conservando lo stato di quelle già presenti. */
  private sync(configs: DeviceConfig[]) {
    const old = new Map(this.devices.map((d) => [d.id, d]));
    const discovered = this.devices.filter((d) => d.discovered);
    this.devices = configs.map((c) => {
      const prev = old.get(c.id);
      return prev ? { ...prev, name: c.name, type: c.type } : this.create(c, false);
    });
    this.devices.push(...discovered);
    this.renderAll();
  }

  private create(c: DeviceConfig, discovered: boolean): Device {
    return {
      ...c,
      ip: fakeIp(),
      mac: fakeMac(),
      signal: randInt(1, 3),
      battery: BATTERY_TYPES.has(c.type) ? randInt(3, 98) : null,
      ping: randInt(2, 60),
      status: 'online',
      discovered,
    };
  }

  private renderAll() {
    this.list.innerHTML = '';
    this.cards.clear();
    for (const d of this.devices) this.list.append(this.renderCard(d));
    this.updateCount();
  }

  private renderCard(d: Device): HTMLElement {
    const card = el('div', 'device');
    card.dataset.status = d.status;
    card.innerHTML = `
      <i class="codicon codicon-${DEVICE_TYPES[d.type].icon} dev-icon"></i>
      <div class="dev-main">
        <div class="dev-name">${escapeHtml(d.name)}</div>
        <div class="dev-meta"></div>
      </div>
      <div class="dev-side"><span class="sig"></span><span class="badge"></span></div>
      <div class="dev-bar"></div>`;
    card.addEventListener('click', () => this.onClick(d));
    this.cards.set(d.id, card);
    this.updateCard(d);
    return card;
  }

  private updateCard(d: Device) {
    const card = this.cards.get(d.id);
    if (!card) return;
    card.dataset.status = d.status;
    const battery = d.battery === null ? '' : ` · ${d.battery}%`;
    card.querySelector('.dev-meta')!.textContent = `${d.ip} · ${d.ping}ms${battery}`;
    card.querySelector('.sig')!.textContent = d.status === 'offline' ? '____' : SIGNAL[d.signal];
    card.querySelector('.badge')!.textContent = LABEL[d.status];
  }

  private updateCount() {
    const pwned = this.devices.filter((d) => d.status === 'pwned').length;
    this.countEl.textContent = String(this.devices.length);
    this.extraEl.textContent = pwned ? `${pwned} pwned` : '192.168.1.0/24';
  }

  /** Piccoli cambiamenti continui: ping, segnale, batteria, qualcuno che va offline. */
  private ambient() {
    for (const d of this.devices) {
      if (d.status === 'attack') continue;
      d.ping = Math.max(1, d.ping + randInt(-6, 6));
      if (chance(0.15)) d.signal = Math.min(3, Math.max(0, d.signal + pick([-1, 1])));
      if (d.battery !== null && chance(0.1)) d.battery = Math.max(1, d.battery - 1);
      if (d.status === 'online' && chance(0.004)) d.status = 'offline';
      else if (d.status === 'offline' && chance(0.12)) d.status = 'online';
      this.updateCard(d);
    }
  }

  all(): Device[] {
    return this.devices;
  }

  get(id: string | undefined): Device | undefined {
    return this.devices.find((d) => d.id === id);
  }

  random(filter: (d: Device) => boolean = () => true): Device | undefined {
    const pool = this.devices.filter((d) => d.status !== 'attack' && filter(d));
    return pool.length ? pick(pool) : undefined;
  }

  setStatus(id: string, status: DeviceStatus) {
    const d = this.get(id);
    if (!d) return;
    d.status = status;
    if (status === 'pwned') d.signal = 3;
    this.updateCard(d);
    this.updateCount();
    const card = this.cards.get(id);
    if (card && status !== 'attack') (card.querySelector('.dev-bar') as HTMLElement).style.width = '0';
  }

  setProgress(id: string, pct: number) {
    const bar = this.cards.get(id)?.querySelector<HTMLElement>('.dev-bar');
    if (bar) bar.style.width = `${pct}%`;
  }

  /** Aggiunge un dispositivo "trovato" dalla scansione. Restituisce undefined se non ce ne sono più. */
  discover(): Device | undefined {
    const names = new Set(this.devices.map((d) => d.name));
    const options = DISCOVERABLE.filter((o) => !names.has(o.name));
    if (!options.length) return undefined;
    const d = this.create({ ...pick(options), id: `x${Date.now()}${randInt(0, 999)}` }, true);
    this.devices.push(d);
    const card = this.renderCard(d);
    card.classList.add('new');
    this.list.append(card);
    card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    this.updateCount();
    return d;
  }
}

export const devicesPanel = new DevicesPanel();
