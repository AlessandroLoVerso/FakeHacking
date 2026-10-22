// Autopilota: l'app scrive e lancia comandi da sola, per girare video senza mani.
import { bus } from '../core/bus';
import { getSettings } from '../core/settings';
import { pick, randInt, sleep } from '../core/util';
import { editor } from '../ui/editor';
import { consoleTerm } from '../ui/terminals';

let on = false;
let typingTimer = 0;
let loopId = 0;

function sampleCommands(): string[] {
  const names = getSettings().devices.map((d) => d.name.toLowerCase());
  const dev = () => (names.length ? pick(names) : 'frigo');
  return [
    `hack ${dev()}`,
    `trace ${dev()}`,
    'decrypt --force',
    'scarica la ricetta della nonna',
    'firewall bypass --level=max',
    'nmap -sV 192.168.1.0/24',
    `sudo hack ${dev()} --stealth`,
    'xqzt9 --overclock --pizza',
    'localizza chi ha finito il caffè',
  ];
}

export const autopilot = {
  get on() {
    return on;
  },
  toggle() {
    this.set(!on);
  },
  set(value: boolean) {
    if (value === on) return;
    on = value;
    bus.emit('autopilot', on);
    clearInterval(typingTimer);
    loopId++;
    if (!on) return;
    typingTimer = window.setInterval(() => editor.type(randInt(2, 5)), 70);
    void commandLoop(loopId);
  },
};

async function commandLoop(id: number) {
  await sleep(1500);
  while (on && id === loopId) {
    await consoleTerm.typeCommand(pick(sampleCommands()));
    await sleep(randInt(9000, 15000));
  }
}
