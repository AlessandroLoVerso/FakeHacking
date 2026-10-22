// Finta sequenza di avvio stile BIOS. Qualsiasi tasto la salta.
import { escapeHtml, randInt, sleep } from '../core/util';
import { BOOT_LINES } from '../data/funny';

const LOGO = String.raw`
 ███████╗ █████╗ ██╗  ██╗███████╗    ██╗  ██╗ █████╗  ██████╗██╗  ██╗██╗███╗   ██╗ ██████╗
 ██╔════╝██╔══██╗██║ ██╔╝██╔════╝    ██║  ██║██╔══██╗██╔════╝██║ ██╔╝██║████╗  ██║██╔════╝
 █████╗  ███████║█████╔╝ █████╗      ███████║███████║██║     █████╔╝ ██║██╔██╗ ██║██║  ███╗
 ██╔══╝  ██╔══██║██╔═██╗ ██╔══╝      ██╔══██║██╔══██║██║     ██╔═██╗ ██║██║╚██╗██║██║   ██║
 ██║     ██║  ██║██║  ██╗███████╗    ██║  ██║██║  ██║╚██████╗██║  ██╗██║██║ ╚████║╚██████╔╝
 ╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═══╝ ╚═════╝`;

export function runBoot(): Promise<void> {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.className = 'boot';
    root.innerHTML = '<div class="hint">premi un tasto per saltare</div>';
    const out = document.createElement('div');
    root.prepend(out);
    document.body.append(root);

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      window.removeEventListener('keydown', finish, true);
      root.removeEventListener('click', finish);
      root.classList.add('out');
      setTimeout(() => {
        root.remove();
        resolve();
      }, 600);
    };
    window.addEventListener('keydown', finish, true);
    root.addEventListener('click', finish);

    const print = (html: string) => {
      out.insertAdjacentHTML('beforeend', `${html}\n`);
    };
    void (async () => {
      print('FakeBIOS v6.9 — (c) 1999 Mainframe S.r.l.');
      print(`CPU: Quantum Pizza Core i13 @ ${randInt(9, 99)}.0 THz`);
      await sleep(250);
      print('<span class="mem"></span>');
      const mem = out.querySelector('.mem')!;
      for (let kb = 0; kb <= 640 && !done; kb += 64) {
        mem.textContent = `Memoria: ${kb}K`;
        await sleep(25);
      }
      for (const line of BOOT_LINES) {
        if (done) return;
        print(escapeHtml(line).replace('[OK]', '<span class="ok">[OK]</span>'));
        await sleep(randInt(90, 240));
      }
      if (done) return;
      print(`<div class="logo">${LOGO}</div>`);
      await sleep(1300);
      finish();
    })();
  });
}
