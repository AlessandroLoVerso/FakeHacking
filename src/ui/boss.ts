// Tasto capo: copre tutto con un finto foglio di calcolo noiosissimo.
import { sfx } from '../core/sfx';
import { el } from '../core/util';

let screen: HTMLElement | null = null;

const ROWS: [string, number, number, number][] = [
  ['Cancelleria', 1200, 1350, 1100],
  ['Caffè e cialde', 3400, 3900, 4700],
  ['Licenze software', 8800, 8800, 9100],
  ['Formazione', 2500, 1800, 2100],
  ['Trasferte', 4100, 3700, 5200],
  ['Manutenzione stampante', 900, 1400, 2300],
  ['Piante da ufficio', 300, 300, 450],
  ['Consulenze', 12000, 11500, 13200],
  ['Server e cloud', 6400, 6900, 7300],
  ['Varie ed eventuali', 700, 650, 980],
];

const eur = (n: number) => n.toLocaleString('it-IT', { minimumFractionDigits: 2 }) + ' €';

export const bossKey = {
  get on() {
    return screen !== null;
  },
  toggle() {
    if (screen) {
      screen.remove();
      screen = null;
      sfx.setMuted(false);
      return;
    }
    sfx.setMuted(true);
    screen = el('div', 'boss');
    const cols = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
    let body = `<tr><th></th>${cols.map((c) => `<th>${c}</th>`).join('')}</tr>`;
    body += `<tr><th>1</th><td colspan="7"><b>Budget Q3 — Centro di costo 0042</b></td></tr>`;
    body += `<tr><th>2</th><td><b>Voce</b></td><td><b>Luglio</b></td><td><b>Agosto</b></td><td><b>Settembre</b></td><td><b>Totale</b></td><td><b>Δ %</b></td><td></td></tr>`;
    const tot = [0, 0, 0];
    ROWS.forEach(([name, a, b, c], i) => {
      tot[0] += a;
      tot[1] += b;
      tot[2] += c;
      const delta = (((c - a) / a) * 100).toFixed(1);
      body += `<tr><th>${i + 3}</th><td>${name}</td><td class="n">${eur(a)}</td><td class="n">${eur(b)}</td><td class="n${i === 1 ? ' sel' : ''}">${eur(c)}</td><td class="n">${eur(a + b + c)}</td><td class="n">${delta}%</td><td></td></tr>`;
    });
    const n = ROWS.length + 3;
    body += `<tr class="total"><th>${n}</th><td>Totale</td>${tot.map((t) => `<td class="n">${eur(t)}</td>`).join('')}<td class="n">${eur(tot[0] + tot[1] + tot[2])}</td><td></td><td></td></tr>`;
    for (let r = n + 1; r < n + 22; r++) body += `<tr><th>${r}</th>${cols.map(() => '<td></td>').join('')}</tr>`;
    screen.innerHTML = `
      <div class="ribbon"><b>Budget_Q3_definitivo.xlsx</b><span>Salvataggio automatico: attivo</span></div>
      <div class="tools"><span>File</span><span>Home</span><span>Inserisci</span><span>Layout</span><span>Formule</span><span>Dati</span><span>Revisione</span></div>
      <div class="formula"><span>E4</span><span>=SOMMA(B4:D4)*1,022</span></div>
      <div class="sheet"><table>${body}</table></div>
      <div class="sheets"><span>Budget Q3</span><span>Previsioni</span><span>Note riunione</span></div>`;
    document.body.append(screen);
  },
};
