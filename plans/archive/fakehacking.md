# FakeHacking — piano

> Stato: **completato**. Approvato il 22/10/2026, pubblicato come v1.0.0 lo stesso giorno.

## Obiettivo

Un'app desktop (Mac + Windows) che sembra la postazione di un hacker da film, con estetica VS Code.
Scrivi qualsiasi cosa (anche a caso) e lo schermo genera codice credibile; premi Invio in console
e parte una sequenza "da film" (tracciamento sulla mappa, attacco a un dispositivo, password che si
decifra…). È tutto finto e divertente: nessuna rete vera, nessun dato vero.

Criterio di successo: lo apri, premi F11, scrivi a caso per 30 secondi e premi Invio un paio di
volte → sembra una scena di un film e fa ridere chi guarda.

## Schermata (layout tipo VS Code)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●                FakeHacking — operazione_pizza.py                       │ barra titolo
├──┬──────────────┬──────────────────────────────────┬─────────────────────────┤
│▣ │ EXPLORER     │ exploit.py  mainframe.c  nonna.sql│ DISPOSITIVI IN RETE (7) │
│⌕ │ ▾ OPERAZIONE │  1 import mainframe              │ iPhone di Ale   ● online │
│⎇ │   exploit.py │  2 def bypass_firewall(t):       │  192.168.1.23 ▂▄▆█ 12%🔋 │
│⚙ │   pizza.js   │  3     ...  ← qui scrivi tu      │ Smart TV Salotto ● online│
│  │   nonna.zip  │                      ▐ minimap ▌ │ Roomba "Gianfranco" PWNED│
│  │──────────────│                                  ├─────────────────────────┤
│  │ TRAFFICO ▁▃▇▅│                                  │ MAPPA TRACKER (mondo,    │
│  │ CPU  ▂▅▃▇    │                                  │ linee tra città, ping)   │
├──┴──────────────┴──────────────────────────────────┴─────────────────────────┤
│ TERMINALE: sniffer │ nmap │ root@mainframe   ← 3 terminali affiancati        │
│ [OK] pkt 0x3F..    │ 22/tcp open ssh │ root@mainframe:~# hack iphone di ale_  │
├──────────────────────────────────────────────────────────────────────────────┤
│ ⎇ main*  ✖ 0 ⚠ 3   Livello hacker 1337   Ln 42, Col 7   UTF-8   🔊  REC ●    │ status bar
└──────────────────────────────────────────────────────────────────────────────┘
```

## Funzionalità

### 1. Editor "hackertyper"
- Qualsiasi tasto premuto scrive 3–5 caratteri di codice vero-finto (Python, C, SQL, JS) con
  syntax highlight stile VS Code Dark+, numeri di riga, minimap, cursore lampeggiante.
- Tab multipli nell'explorer (exploit.py, mainframe.c, pizza.js, nonna.sql…): cliccandoli cambia linguaggio.
- Commenti divertenti nascosti nel codice (`# TODO: chiedere a mamma la password del Wi-Fi`).

### 2. Console vera (dove scrivi tu)
- Nel terminale di destra scrivi liberamente; Invio interpreta il testo:

| Scrivi (anche dentro frasi a caso) | Cosa succede |
|---|---|
| nome di un dispositivo (`ale`, `tv`, `frigo`…) o `hack` | Attacco al dispositivo: barra progresso, firewall, ACCESS GRANTED, la scheda diventa rossa **PWNED** e mostra dati buffi (ultima ricerca: "come fare la carbonara senza panna", 847 selfie, playlist "Lacrime 2019") |
| `trace`, `track`, `trova`, `localizza` | Mappa: zoom sul mondo, linee che rimbalzano tra città, triangolazione con cerchi, coordinate che si stringono, indirizzo finale assurdo ("Via dei Matti 0, Bologna") |
| `decrypt`, `password`, `crack` | Password che si decifra lettera per lettera tipo slot machine → `ilgattodiale2003` |
| `download`, `scarica` | Download di `segreti_della_nonna.zip`, `ricetta_tiramisu_TOP_SECRET.pdf` con velocità assurde |
| `firewall`, `bypass` | Muro di blocchi che si sgretola, livelli di sicurezza che cadono uno a uno |
| `matrix` | Pioggia di caratteri a tutto schermo |
| `nuke`, `autodistruzione` | Schermo rosso, allarme, conto alla rovescia… poi "scherzo 😄" |
| `scan`, `nmap` | Scansione rete: compaiono nuovi dispositivi uno alla volta |
| `help`, `aiuto` | Lista comandi in stile man page |
| testo senza senso | Viene trattato come "exploit custom": parte una sequenza casuale tra quelle sopra |

### 3. Pannello dispositivi in rete (finti)
- Schede con icona, nome, IP, MAC, segnale, batteria, stato (online / bloccato / PWNED).
- Lista di default inventata e **modificabile dalle impostazioni** (nomi dei tuoi amici):
  iPhone di Ale, MacBook di Giulia, Smart TV del Salotto, PlayStation di Marco, Frigo Samsung,
  Alexa della Nonna, Roomba "Gianfranco", Tostapane IoT.
- Ogni tanto un dispositivo cambia stato da solo o arriva una notifica buffa
  ("Giulia ha cambiato la password in 'password123'").

### 4. Mappa tracker + grafici
- Mappa del mondo (offline, inclusa nell'app) con ping, linee animate tra città, cerchi di triangolazione.
- Grafici live: traffico, CPU, pacchetti/s, hex dump che scorre.

### 5. Modalità film (per girare video)
- Tasti segreti del regista: `F1` ACCESS GRANTED gigante, `F2` ACCESS DENIED, `F3` tracciamento,
  `F4` allarme rosso, `F5` matrix, `F11` schermo intero, `Esc` chiude gli overlay.
- **Autopilota** (`F9`): l'app scrive e lancia sequenze da sola, per riprese senza mani.
- **Tasto capo** (`Ctrl+B`): tutto sparisce e compare un finto foglio Excel "Budget Q3".
- Avvio con finta sequenza di boot ("Inizializzo mainframe… caffè: OK").
- Effetti: glitch, scanline CRT (attivabili), schermate che tremano quando succede qualcosa.

### 6. Suoni e impostazioni
- Suoni sintetizzati (tasti, beep, allarme), niente file audio, `M` per silenziare.
- Impostazioni: nome hacker, lista dispositivi, tema (Dark+, Verde hacker, Allarme rosso),
  velocità di scrittura, effetti on/off. Salvate in locale.

## Tecnologia

- **Electron + Vite + TypeScript** senza framework UI (canvas per mappa/matrix, DOM per il resto).
- Font JetBrains Mono (licenza OFL) e icone Codicons (CC BY 4.0, citate nel README), tutto incluso
  nell'app: funziona offline.
- Mappa: `world-atlas` (Natural Earth, pubblico dominio) + `d3-geo`.
- Pacchetti: `electron-builder`.
  - Mac: `.dmg` per Apple Silicon e uno per Intel.
  - Windows: `.exe` portable (doppio clic, niente installazione) + installer.
- Build ufficiali su **GitHub Actions** (runner macOS e Windows): a ogni tag `vX.Y.Z` crea una
  Release su GitHub con i file scaricabili. Build Mac anche in locale per i test.

### Struttura file prevista
```
electron/main.ts, electron/preload.ts
src/index.html, src/main.ts, src/styles/
src/ui/        layout, editor, terminals, devices, map, charts, statusbar, overlays, settings, bossKey
src/engine/    commands.ts (parser), sequences/*.ts, autopilot.ts, hotkeys.ts
src/data/      codeSnippets.ts, devices.ts, funnyData.ts
src/audio/sfx.ts
tests/commands.test.ts
build/icon.png
.github/workflows/release.yml
electron-builder.yml, vite.config.ts, package.json, README.md
```

## Fasi (la più rischiosa per prima)

| # | Fase | Verifica | Bloccata da |
|---|---|---|---|
| F1 | Scheletro Electron + pipeline di build + repo GitHub `FakeHacking` + prima build CI | `npm run dev` apre la finestra; `npm run dist:mac` crea il .dmg; GitHub Actions verde con .dmg e .exe | — |
| F2 | Layout VS Code completo + temi | Anteprima nel browser a 1440×900 e 1280×720, screenshot | F1 |
| F3 | Editor hackertyper con highlight e tab | Scrivendo a caso compare codice colorato, tab cambiano linguaggio | F2 |
| F4 | Console + motore comandi + 3 terminali che scorrono | Test `vitest` sul parser (parole chiave, frasi miste, gibberish) + prova a mano | F2 |
| F5 | Pannello dispositivi + sequenza attacco + dati buffi | `hack iphone di ale` → scheda PWNED con dati | F4 |
| F6 | Mappa tracker + decrypt, download, firewall, matrix, nuke, scan | Ogni comando lanciato in anteprima, screenshot di ciascuno | F4 |
| F7 | Modalità film: overlay, tasti regista, autopilota, tasto capo, boot, suoni | Ogni tasto F provato; autopilota gira 2 minuti senza errori in console | F5, F6 |
| F8 | Impostazioni + salvataggio | Cambio nome dispositivo → resta dopo riavvio | F5 |
| F9 | README con screenshot, icona, tag `v1.0.0`, Release | Release su GitHub con 3 file; il .dmg si apre sul tuo Mac | F7, F8 |

## Decisioni (consigliate, da confermare)

| # | Decisione | Scelta consigliata | Perché |
|---|---|---|---|
| D1 | Tecnologia | Electron | Stesso motore grafico su Mac e Windows, effetti identici. Tauri pesa meno (~10 MB contro ~100 MB) ma serve Rust (non installato) e il rendering cambia tra i sistemi |
| D2 | Come si creano gli eseguibili | GitHub Actions → Release | Dal Mac non si può fare un .exe affidabile senza Wine; i runner di GitHub costruiscono entrambi |
| D3 | Repo | `AlessandroLoVerso/FakeHacking`, **pubblica** | Link di download facile da girare agli amici; Actions gratis |
| D4 | Cartella del progetto | `~/Documents/FakeHacking` | La cartella attuale è temporanea e sparisce con la sessione |
| D5 | Lingua | Scritte "da film" in inglese (ACCESS GRANTED, TRACING…) + battute e dati in italiano | Fa più film, ma le battute arrivano |
| D6 | Firma app | Nessuna (Apple chiede 99 $/anno) | Al primo avvio: Mac → tasto destro › Apri; Windows → "Ulteriori informazioni › Esegui comunque". Spiegato nel README |

## Assunzioni (correggimi ora o procedo così)

1. Tutto è simulato: l'app non fa nessuna richiesta di rete e non legge nulla del computer.
2. All'avvio si apre a finestra massimizzata; `F11` per lo schermo intero.
3. Suoni accesi di default, `M` per spegnerli.
4. Nessun aggiornamento automatico.
5. I dispositivi di default sono inventati; i nomi veri li metti tu dalle impostazioni.

## Sempre / Mai

- **Sempre**: offline, finto, divertente, leggibile a schermo intero a 1080p.
- **Mai**: rete vera, scansioni vere, raccolta dati, firma/notarizzazione Apple, build Linux,
  aggiornamenti automatici, versione mobile.

## Progress

| Fase | Stato |
|---|---|
| F1 | fatto |
| F2 | fatto |
| F3 | fatto |
| F4 | fatto |
| F5 | fatto |
| F6 | fatto |
| F7 | fatto |
| F8 | fatto |
| F9 | fatto |

## Resoconto

- **Pubblicato:** v1.0.0 su GitHub Releases (dmg arm64 e x64, exe portable e installer), build da GitHub Actions.
- **Verifiche:** 16 test Vitest; tutti i comandi e i tasti provati nel browser; app Electron vera avviata sul Mac
  con screenshot via DevTools; impostazioni ancora presenti dopo un riavvio reale; dmg della Release scaricato e avviato.
- **Non verificato:** l'exe Windows non è stato avviato su un PC vero.
- **Deviazioni dal piano:**
  - La cartella Documenti è sincronizzata con iCloud e il disco era al 98%: le librerie sono segnate come ignorate da iCloud
    e il dmg locale va costruito fuori da iCloud (la firma ad-hoc fallisce dentro).
  - Tutte le librerie sono in devDependencies: Vite le impacchetta, l'app non porta node_modules.
- **Dopo il rilascio (23/10/2026):** l'app è stata rinominata **Hacking** e a schermo non compare più "fake", "finto" o
  "scherzo" (richiesta dell'utente: la scena deve reggere).
