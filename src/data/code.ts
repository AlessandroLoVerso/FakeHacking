// Il codice "vero-finto" che compare quando si scrive nell'editor.

export type Lang = 'python' | 'c' | 'sql' | 'js';

export interface CodeFile {
  name: string;
  lang: Lang;
  langLabel: string;
  icon: string;
  color: string;
  symbol: string;
  code: string;
}

const PYTHON = `#!/usr/bin/env python3
# exploit.py — Operazione Pizza
# TODO: chiedere a mamma la password del Wi-Fi

import socket
import hashlib
from mainframe import Satellite, Firewall, Nonna
from crypto.quantum import decrypt_aes4096

TARGET = "192.168.1.23"
PORTS = [22, 80, 443, 1337, 8080]
CAFFE_MINIMO = 3


class Exploit:
    def __init__(self, target, stealth=True):
        self.target = target
        self.stealth = stealth
        self.payload = b"\\x90" * 64 + b"PIZZA"
        self.sat = Satellite(orbit="bassa", owner="nonna")

    def scan(self):
        aperte = []
        for port in PORTS:
            s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            s.settimeout(0.3)
            if s.connect_ex((self.target, port)) == 0:
                aperte.append(port)
            s.close()
        return aperte

    def bypass_firewall(self, fw: Firewall):
        # Funziona sempre nei film, quindi funziona anche qui
        for layer in fw.layers:
            key = hashlib.sha256(layer.name.encode()).hexdigest()
            layer.disable(override=key[:16])
            print(f"[+] Livello {layer.name} disattivato")
        return True

    def inject(self, port):
        if caffe_bevuti() < CAFFE_MINIMO:
            raise RuntimeError("Troppo poco caffè per hackerare")
        packet = self.payload + port.to_bytes(2, "big")
        return self.sat.uplink(self.target, packet)

    def triangulate(self, towers):
        lat = sum(t.lat * t.signal for t in towers) / len(towers)
        lon = sum(t.lon * t.signal for t in towers) / len(towers)
        return round(lat, 5), round(lon, 5)


def caffe_bevuti():
    return Nonna.conta_tazzine(cucina="principale")


if __name__ == "__main__":
    e = Exploit(TARGET)
    porte = e.scan()
    print(f"[*] Porte aperte: {porte}")
    e.bypass_firewall(Firewall.detect(TARGET))
    for p in porte:
        e.inject(p)
    segreto = decrypt_aes4096(e.sat.download("ricetta_tiramisu"))
    print("[+] ACCESS GRANTED")  # momento epico, alzare la musica

`;

const C = `/* mainframe.c — kernel del mainframe, non toccare
 * Scritto alle 3 di notte, funziona per miracolo.
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <stdint.h>
#include "mainframe.h"
#include "pizza.h"

#define MAX_HACK_LEVEL 1337
#define BUFFER_SIZE 4096
#define SEGRETO 0xDEADBEEF

typedef struct {
    uint32_t ip;
    uint16_t port;
    char owner[64];
    int pwned;
} node_t;

static node_t rete[256];
static int nodi_trovati = 0;

int scan_subnet(uint32_t base) {
    for (int i = 1; i < 255; i++) {
        uint32_t ip = base | i;
        if (ping(ip, 50) == PONG) {
            rete[nodi_trovati].ip = ip;
            rete[nodi_trovati].port = 22;
            nodi_trovati++;
        }
    }
    return nodi_trovati;
}

void overflow_buffer(char *dst, const char *src) {
    char buffer[BUFFER_SIZE];
    memcpy(buffer, src, strlen(src)); // si, lo so, è pericoloso
    xor_cipher(buffer, SEGRETO, BUFFER_SIZE);
    strncpy(dst, buffer, BUFFER_SIZE - 1);
}

int hack_node(node_t *n) {
    if (n->pwned) return 0;
    uint8_t *shellcode = malloc(512);
    if (!shellcode) {
        fprintf(stderr, "memoria finita, ordinare altra RAM\\n");
        return -1;
    }
    build_shellcode(shellcode, n->ip, n->port);
    int ok = inject_payload(n->ip, shellcode, 512);
    free(shellcode);
    n->pwned = ok == 0;
    return ok;
}

int main(int argc, char **argv) {
    printf("[*] Mainframe v6.9 avviato\\n");
    int trovati = scan_subnet(0xC0A80100);
    printf("[*] Nodi trovati: %d\\n", trovati);
    for (int i = 0; i < trovati; i++) {
        if (hack_node(&rete[i]) == 0)
            printf("[+] %s è nostro\\n", rete[i].owner);
    }
    ordina_pizza(MARGHERITA, 2);  /* ricompensa */
    return 0;
}

`;

const SQL = `-- nonna.sql — database segreto delle ricette
-- ATTENZIONE: contiene il ragù. Maneggiare con cura.

CREATE TABLE ricette (
    id          SERIAL PRIMARY KEY,
    nome        VARCHAR(120) NOT NULL,
    segreta     BOOLEAN DEFAULT TRUE,
    difficolta  INTEGER CHECK (difficolta BETWEEN 1 AND 11),
    creata_il   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE ingredienti (
    ricetta_id  INTEGER REFERENCES ricette(id),
    nome        VARCHAR(80),
    quantita    VARCHAR(40),  -- "q.b." nel 90% dei casi
    segreto     BOOLEAN DEFAULT FALSE
);

INSERT INTO ricette (nome, segreta, difficolta)
VALUES ('Ragù della domenica', TRUE, 11),
       ('Tiramisù', TRUE, 7),
       ('Pasta al forno', FALSE, 5);

SELECT r.nome, i.nome AS ingrediente, i.quantita
FROM ricette r
JOIN ingredienti i ON i.ricetta_id = r.id
WHERE r.segreta = TRUE
  AND i.segreto = TRUE
ORDER BY r.difficolta DESC;

UPDATE utenti
SET password_hash = crypt('nonnaelamigliore', gen_salt('bf'))
WHERE username = 'admin';

DELETE FROM log_accessi
WHERE ip_sorgente = '192.168.1.23'
  AND creato_il > NOW() - INTERVAL '5 minutes';  -- nessuna traccia

GRANT ALL PRIVILEGES ON DATABASE cucina TO hacker;

SELECT COUNT(*) AS yogurt_scaduti
FROM frigo
WHERE scadenza < CURRENT_DATE;

`;

const JS = `// pizza.js — dashboard di controllo dell'operazione
'use strict';

import { Mainframe } from './mainframe.js';
import { trace, triangulate } from './satellite.js';

const config = {
  target: '192.168.1.23',
  stealth: true,
  pizza: { gusto: 'margherita', quantita: 2 },
  timeoutMs: 1337,
};

class Operazione {
  constructor(nome, cfg) {
    this.nome = nome;
    this.cfg = cfg;
    this.mainframe = new Mainframe({ cluster: 'nonna-01' });
    this.log = [];
  }

  async infiltrate() {
    const porte = await this.mainframe.scan(this.cfg.target);
    for (const porta of porte.filter((p) => p.open)) {
      this.log.push(\`porta \${porta.number} aperta\`);
      await this.mainframe.inject(porta, Buffer.from('PIZZA'));
    }
    return porte.length > 0;
  }

  async localizza(persona) {
    const torri = await trace(persona, { hops: 7, proxy: 'reykjavik' });
    const { lat, lon } = triangulate(torri);
    console.log(\`[+] \${persona} si trova a \${lat.toFixed(5)}, \${lon.toFixed(5)}\`);
    return { lat, lon };
  }

  ordinaPizza() {
    // la parte più importante di tutta l'operazione
    return fetch('pizzeria://da-mario/ordina', {
      method: 'POST',
      body: JSON.stringify(this.cfg.pizza),
    });
  }
}

const op = new Operazione('Pizza', config);
op.infiltrate()
  .then(() => op.localizza('chi ha finito il caffè'))
  .then(() => op.ordinaPizza())
  .catch((err) => console.error('[!] Missione fallita:', err.message));

`;

export const CODE_FILES: CodeFile[] = [
  { name: 'exploit.py', lang: 'python', langLabel: 'Python', icon: 'symbol-method', color: '#e5c07b', symbol: 'bypass_firewall', code: PYTHON },
  { name: 'mainframe.c', lang: 'c', langLabel: 'C', icon: 'chip', color: '#61afef', symbol: 'hack_node', code: C },
  { name: 'nonna.sql', lang: 'sql', langLabel: 'SQL', icon: 'database', color: '#e06c75', symbol: 'ricette', code: SQL },
  { name: 'pizza.js', lang: 'js', langLabel: 'JavaScript', icon: 'json', color: '#f1e05a', symbol: 'infiltrate', code: JS },
];
