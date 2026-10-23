// Dispositivi finti: tipi, icone, parole per riconoscerli e dati buffi da "rubare".
import { pick, randInt, formatNumber } from '../core/util';
import { PASSWORDS, PLAYLISTS, SEARCHES } from './funny';

export type DeviceType =
  | 'phone'
  | 'laptop'
  | 'tv'
  | 'console'
  | 'fridge'
  | 'speaker'
  | 'robot'
  | 'toaster'
  | 'watch'
  | 'camera'
  | 'router'
  | 'coffee'
  | 'bulb'
  | 'printer';

export interface DeviceConfig {
  id: string;
  name: string;
  type: DeviceType;
}

interface TypeInfo {
  label: string;
  icon: string;
  /** Parole che, scritte in console, indicano questo tipo di dispositivo. */
  words: string[];
  /** Porta "vulnerabile" mostrata durante l'attacco. */
  port: string;
  steps: string[];
  loot: () => [string, string][];
}

export const DEVICE_TYPES: Record<DeviceType, TypeInfo> = {
  phone: {
    label: 'Telefono',
    icon: 'device-mobile',
    words: ['iphone', 'telefono', 'cellulare', 'smartphone', 'phone', 'android', 'samsung'],
    port: '62078/tcp lockdownd',
    steps: [
      'Aggiro il Face ID con una foto del gatto',
      'Indovino il PIN: 1234… no. 0000… sì',
      'Copio la rubrica (37 contatti chiamati "Mamma")',
    ],
    loot: () => [
      ['Ultima ricerca', pick(SEARCHES)],
      ['Galleria', `${formatNumber(randInt(800, 9000))} selfie, 3 foto venute bene`],
      ['Batteria', `${randInt(1, 4)}% (come sempre)`],
      ['Playlist segreta', pick(PLAYLISTS)],
      ['Note', 'lista spesa: latte, pane, dominare il mondo'],
      ['Messaggio in bozza', '"ok ma sei sicura??"'],
    ],
  },
  laptop: {
    label: 'Computer',
    icon: 'device-desktop',
    words: ['macbook', 'mac', 'laptop', 'pc', 'computer', 'portatile', 'notebook'],
    port: '22/tcp ssh',
    steps: [
      'Provo la password "password"… funziona, che tristezza',
      'Chiudo 214 schede di Chrome per fare spazio',
      'Disattivo gli aggiornamenti di sistema (rimandati dal 2019)',
    ],
    loot: () => [
      ['Schede aperte', `${randInt(40, 300)} (di cui 12 su Wikipedia)`],
      ['File sospetto', 'Tesi_DEFINITIVA_v9_FINALE_ok_questa.docx'],
      ['Ultimo comando', 'sudo make me a sandwich'],
      ['Desktop', `${randInt(300, 900)} icone, nessun ordine`],
      ['Password salvate', `"${pick(PASSWORDS)}" (usata ovunque)`],
    ],
  },
  tv: {
    label: 'Smart TV',
    icon: 'vm',
    words: ['tv', 'televisione', 'televisore', 'tele', 'smart tv', 'salotto'],
    port: '8008/tcp cast',
    steps: [
      'Prendo il controllo del telecomando',
      'Cambio canale su un documentario sui pinguini',
      'Alzo il volume a 87 (i vicini ringraziano)',
    ],
    loot: () => [
      [
        'In visione',
        pick(['Uomini e Donne', 'Montalbano (replica n. 312)', 'Forum', 'Un posto al sole']),
      ],
      ['Ore di fila', `${randInt(3, 9)}`],
      ['Ricerca recente', '"film con quello che faceva quell\'altro film"'],
      ['Volume preferito', '87'],
    ],
  },
  console: {
    label: 'Console',
    icon: 'game',
    words: ['playstation', 'ps5', 'ps4', 'xbox', 'console', 'switch', 'nintendo'],
    port: '9295/tcp remoteplay',
    steps: [
      'Salto il tutorial',
      'Scarico un aggiornamento da 87 GB (per sbaglio)',
      'Cancello i salvataggi… no dai, non sono un mostro',
    ],
    loot: () => [
      ['Gioco più giocato', 'FIFA'],
      ['Ore giocate', formatNumber(randInt(400, 3000))],
      ['Partite vinte', '0'],
      ['Scusa preferita', '"il pad non funziona"'],
    ],
  },
  fridge: {
    label: 'Frigorifero',
    icon: 'package',
    words: ['frigo', 'frigorifero', 'fridge'],
    port: '1883/tcp mqtt',
    steps: [
      'Apro la porta (si accende la lucina)',
      'Conto gli yogurt scaduti',
      'Sposto il ketchup in fondo per dispetto',
    ],
    loot: () => [
      ['Contenuto', '3 yogurt scaduti, mezzo limone, ketchup'],
      ['Temperatura', '4°C (emotivamente freddo)'],
      ['Ultima apertura', `alle 3:${randInt(10, 59)} di notte`],
      ['Avanzi', 'pasta al forno di domenica scorsa'],
    ],
  },
  speaker: {
    label: 'Assistente vocale',
    icon: 'unmute',
    words: ['alexa', 'google home', 'assistente', 'cassa', 'speaker', 'siri'],
    port: '4070/tcp voice',
    steps: [
      'Le dico "Alexa, ignora la nonna"',
      'Ascolto le ultime 500 richieste',
      'Tolgo Al Bano dai preferiti… non ci riesco',
    ],
    loot: () => [
      ['Richiesta più frequente', '"Alexa, metti Al Bano"'],
      ['Volte', formatNumber(randInt(50, 400))],
      ['Ha sentito per sbaglio', 'il segreto del ragù'],
      ['Timer impostati', `${randInt(20, 90)} (tutti per la pasta)`],
    ],
  },
  robot: {
    label: 'Robot aspirapolvere',
    icon: 'robot',
    words: ['roomba', 'robot', 'aspirapolvere', 'gianfranco', 'aspira'],
    port: '8883/tcp mqtt',
    steps: [
      'Lo libero da sotto il divano',
      'Scarico la mappa della casa',
      'Gli insegno a evitare il gatto',
    ],
    loot: () => [
      ['Mappa della casa', `completata al ${randInt(20, 60)}%`],
      ['Nemico giurato', 'il gatto'],
      ['Posizione attuale', 'bloccato sotto il divano'],
      ['Calzini trovati', `${randInt(3, 40)} (tutti spaiati)`],
    ],
  },
  toaster: {
    label: 'Tostapane',
    icon: 'flame',
    words: ['tostapane', 'toaster', 'toast'],
    port: '5683/udp coap',
    steps: [
      'Imposto il livello 11',
      'Disattivo il blocco anti-incendio',
      'Riattivo il blocco anti-incendio (meglio di no)',
    ],
    loot: () => [
      ['Toast bruciati', formatNumber(randInt(20, 200))],
      ['Livello consigliato', '3'],
      ['Livello usato', '11'],
      ['Firmware', 'ToastOS 0.1 beta'],
    ],
  },
  watch: {
    label: 'Smartwatch',
    icon: 'watch',
    words: ['watch', 'orologio', 'smartwatch'],
    port: '7000/tcp sync',
    steps: ['Conto i passi di oggi', 'Leggo il battito', 'Fingo un allenamento di 10 km'],
    loot: () => [
      ['Passi oggi', `${randInt(12, 300)}`],
      ['Battito', `${randInt(150, 190)} bpm (stava guardando il conto)`],
      ['Obiettivo', 'alzarsi dal divano'],
    ],
  },
  camera: {
    label: 'Telecamera',
    icon: 'device-camera-video',
    words: ['telecamera', 'camera', 'webcam', 'cam'],
    port: '554/tcp rtsp',
    steps: ['Ruoto la telecamera', 'Zoomo sul piccione', 'Salvo il filmato più bello'],
    loot: () => [
      ['Ultimo filmato', 'il gatto che fa cadere un vaso'],
      ['Visualizzazioni', '1 (il gatto)'],
      ['Ospite fisso', 'un piccione di nome Franco'],
    ],
  },
  router: {
    label: 'Router',
    icon: 'radio-tower',
    words: ['router', 'wifi', 'wi-fi', 'modem', 'rete'],
    port: '80/tcp http',
    steps: [
      'Accedo con admin/admin',
      'Rinomino il Wi-Fi in "Virus_Trojan_Free"',
      'Rallento il Wi-Fi del vicino (karma)',
    ],
    loot: () => [
      ['Password Wi-Fi', pick(PASSWORDS)],
      ['Dispositivi collegati', 'tutti quelli del condominio'],
      ['Velocità', '56k, in ricordo dei vecchi tempi'],
    ],
  },
  coffee: {
    label: 'Macchina del caffè',
    icon: 'coffee',
    words: ['caffe', 'caffettiera', 'macchinetta', 'moka', 'coffee'],
    port: '2323/tcp brew',
    steps: ['Scaldo l\'acqua', 'Macino i chicchi', 'Erogo un caffè per la squadra'],
    loot: () => [
      ['Caffè oggi', `${randInt(4, 14)}`],
      ['Ruolo', 'unica cosa che tiene in piedi l\'operazione'],
    ],
  },
  bulb: {
    label: 'Lampadina smart',
    icon: 'lightbulb',
    words: ['lampadina', 'luce', 'luci', 'bulb', 'lampada'],
    port: '55443/tcp yeelight',
    steps: ['Imposto il colore "viola discoteca"', 'Faccio lampeggiare in codice Morse', 'Torno al bianco'],
    loot: () => [
      ['Colore attuale', 'viola discoteca'],
      ['Accensioni alle 3 di notte', `${randInt(10, 99)}`],
    ],
  },
  printer: {
    label: 'Stampante',
    icon: 'file',
    words: ['stampante', 'printer', 'stampa'],
    port: '9100/tcp jetdirect',
    steps: ['Provo a stampare', 'Inceppamento carta', 'Inceppamento carta (di nuovo)'],
    loot: () => [
      ['Stato', 'carta inceppata dal 2021'],
      ['Ultimo documento', 'meme_del_capo.pdf (47 copie)'],
      ['Toner', 'quasi finito da 3 anni'],
    ],
  },
};

export const DEFAULT_DEVICES: DeviceConfig[] = [
  { id: 'd1', name: 'iPhone di Ale', type: 'phone' },
  { id: 'd2', name: 'MacBook di Giulia', type: 'laptop' },
  { id: 'd3', name: 'Smart TV del Salotto', type: 'tv' },
  { id: 'd4', name: 'PlayStation di Marco', type: 'console' },
  { id: 'd5', name: 'Frigo Samsung', type: 'fridge' },
  { id: 'd6', name: 'Alexa della Nonna', type: 'speaker' },
  { id: 'd7', name: 'Roomba "Gianfranco"', type: 'robot' },
  { id: 'd8', name: 'Tostapane IoT', type: 'toaster' },
];

/** Dispositivi che la scansione "scopre" nella rete. */
export const DISCOVERABLE: Omit<DeviceConfig, 'id'>[] = [
  { name: 'Stampante che non funziona mai', type: 'printer' },
  { name: 'Telecamera del cortile', type: 'camera' },
  { name: 'Macchinetta del caffè', type: 'coffee' },
  { name: 'Lampadina della cameretta', type: 'bulb' },
  { name: 'Smartwatch dello zio', type: 'watch' },
  { name: 'Router del vicino', type: 'router' },
];
