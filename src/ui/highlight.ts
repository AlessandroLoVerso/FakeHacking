// Evidenziatore di sintassi minimale, riga per riga, con i colori di VS Code Dark+.
import type { Lang } from '../data/code';
import { escapeHtml } from '../core/util';

export interface Tok {
  c: string;
  t: string;
}

interface LangDef {
  comment: string;
  kw: Set<string>;
  ctrl: Set<string>;
  types: Set<string>;
  caseInsensitive?: boolean;
}

const words = (s: string) => new Set(s.split(/\s+/).filter(Boolean));

const LANGS: Record<Lang, LangDef> = {
  python: {
    comment: '#',
    kw: words('def class import from as with lambda None True False and or not in is global pass self print'),
    ctrl: words('if elif else for while return try except raise break continue yield finally'),
    types: words('int str bytes list dict float bool'),
  },
  c: {
    comment: '//',
    kw: words('int char void struct typedef static const unsigned long short sizeof NULL return_t'),
    ctrl: words('if else for while return break continue switch case default goto'),
    types: words('uint8_t uint16_t uint32_t uint64_t size_t node_t FILE'),
  },
  sql: {
    comment: '--',
    kw: words(
      'CREATE TABLE SELECT FROM WHERE JOIN ON AND OR INSERT INTO VALUES UPDATE SET DELETE GRANT ALL PRIVILEGES DATABASE TO ORDER BY DESC ASC PRIMARY KEY NOT NULL DEFAULT REFERENCES CHECK BETWEEN AS INTERVAL TRUE FALSE',
    ),
    ctrl: words('COUNT NOW CURRENT_DATE crypt gen_salt'),
    types: words('SERIAL VARCHAR INTEGER BOOLEAN TIMESTAMP TEXT'),
    caseInsensitive: true,
  },
  js: {
    comment: '//',
    kw: words('const let var function class new this import from export async await typeof instanceof true false null undefined constructor'),
    ctrl: words('if else for of in while return try catch throw break continue switch case'),
    types: words('Buffer JSON Promise Object Array'),
  },
};

export function tokenize(line: string, lang: Lang): Tok[] {
  const L = LANGS[lang];
  const out: Tok[] = [];
  const push = (c: string, t: string) => {
    const last = out[out.length - 1];
    if (last && last.c === c) last.t += t;
    else out.push({ c, t });
  };
  const firstNonSpace = line.search(/\S/);
  let i = 0;
  while (i < line.length) {
    const rest = line.slice(i);
    const ch = line[i];

    if (rest.startsWith(L.comment) || (lang === 'c' && rest.startsWith('/*'))) {
      push('tk-com', rest);
      break;
    }
    if (lang === 'c' && i === firstNonSpace && /^\*(\s|\/|$)/.test(rest)) {
      push('tk-com', rest);
      break;
    }
    if (lang === 'c' && ch === '#' && i === firstNonSpace) {
      const m = /^#\w+/.exec(rest)!;
      push('tk-ctrl', m ? m[0] : '#');
      i += m ? m[0].length : 1;
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      let j = i + 1;
      while (j < line.length && line[j] !== ch) j += line[j] === '\\' ? 2 : 1;
      push('tk-str', line.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (/[0-9]/.test(ch) && !/[A-Za-z_]/.test(line[i - 1] ?? '')) {
      const m = /^(0x[0-9a-fA-F]+|\d+(\.\d+)?)/.exec(rest)!;
      push('tk-num', m[0]);
      i += m[0].length;
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const w = /^[A-Za-z_][A-Za-z0-9_]*/.exec(rest)![0];
      const key = L.caseInsensitive ? w.toUpperCase() : w;
      const next = line.slice(i + w.length).trimStart()[0];
      let c = 'tk-var';
      if (L.kw.has(key) || (L.caseInsensitive && L.kw.has(w))) c = 'tk-kw';
      else if (L.ctrl.has(key) || L.ctrl.has(w)) c = 'tk-ctrl';
      else if (L.types.has(key) || L.types.has(w)) c = 'tk-type';
      else if (next === '(') c = 'tk-fn';
      else if (/^[A-Z][a-z]/.test(w)) c = 'tk-type';
      else if (/^[A-Z_]+$/.test(w)) c = 'tk-num';
      push(c, w);
      i += w.length;
      continue;
    }
    push('tk-op', ch);
    i++;
  }
  return out;
}

export function toHtml(toks: Tok[]): string {
  return toks.map((k) => `<span class="${k.c}">${escapeHtml(k.t)}</span>`).join('');
}
