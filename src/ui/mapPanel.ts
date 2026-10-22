// Mappa piccola nella colonna destra, sempre in movimento.
import { clock, el, icon, randInt } from '../core/util';
import { WorldMap } from './map';

let map: WorldMap | null = null;

export function mountMapPanel(pane: HTMLElement) {
  pane.innerHTML = `<div class="pane-title">${icon('globe')} MAPPA TRACKER <span class="extra">satellite: ON</span></div>`;
  const canvas = el('canvas');
  const info = el('div', 'map-info');
  pane.append(canvas, info);
  map = new WorldMap(canvas, true);
  const tick = () => {
    info.innerHTML = `<span>nodi ${randInt(24, 31)} · uplink ${randInt(91, 99)}%</span><span>${clock()} UTC+1</span>`;
  };
  tick();
  setInterval(tick, 1000);
}

export const sideMap = () => map;
