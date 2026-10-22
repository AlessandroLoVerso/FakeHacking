import { describe, expect, it } from 'vitest';
import { parseCommand, findDevice } from '../src/engine/commands';
import { DEFAULT_DEVICES } from '../src/data/devices';

const parse = (s: string) => parseCommand(s, DEFAULT_DEVICES);

describe('parseCommand', () => {
  it('riga vuota non fa niente', () => {
    expect(parse('   ').kind).toBe('empty');
  });

  it('comandi a prima parola', () => {
    expect(parse('help').kind).toBe('help');
    expect(parse('Aiuto').kind).toBe('help');
    expect(parse('clear').kind).toBe('clear');
    expect(parse('whoami').kind).toBe('whoami');
    expect(parse('sudo rm -rf /').kind).toBe('sudo');
    expect(parse('exit').kind).toBe('exit');
  });

  it('i comandi a prima parola non scattano in mezzo alla frase', () => {
    expect(parse('dimmi help del frigo').kind).not.toBe('help');
  });

  it('riconosce un dispositivo anche senza verbo', () => {
    const cmd = parse('iphone di ale');
    expect(cmd.kind).toBe('hack');
    expect(cmd.deviceId).toBe('d1');
  });

  it('hack con dispositivo dentro una frase', () => {
    const cmd = parse('ok adesso hackera il frigo per favore');
    expect(cmd.kind).toBe('hack');
    expect(cmd.deviceId).toBe('d5');
  });

  it('trace con dispositivo', () => {
    const cmd = parse('trace alexa della nonna');
    expect(cmd.kind).toBe('trace');
    expect(cmd.deviceId).toBe('d6');
  });

  it('trace senza dispositivo', () => {
    expect(parse('localizza chi ha finito il caffè').kind).toBe('trace');
    expect(parse('trova quel tizio').kind).toBe('trace');
    expect(parse('caffè').kind).toBe('coffee');
  });

  it('accenti e maiuscole non contano', () => {
    expect(parse('DECIFRA la PASSWORD').kind).toBe('decrypt');
    expect(parse('scarica la ricetta della nonna').kind).toBe('download');
  });

  it('priorità: nuke batte tutto', () => {
    expect(parse('hack nuke frigo').kind).toBe('nuke');
  });

  it('effetti speciali', () => {
    expect(parse('matrix').kind).toBe('matrix');
    expect(parse('firewall bypass --force').kind).toBe('firewall');
    expect(parse('nmap -sV 192.168.1.0/24').kind).toBe('scan');
  });

  it('testo senza senso diventa un exploit personalizzato', () => {
    expect(parse('asdkjh qwe zxcvb').kind).toBe('custom');
    expect(parse('for i in range(10): print(i)').kind).toBe('custom');
  });
});

describe('findDevice', () => {
  it('sceglie il nome più specifico', () => {
    expect(findDevice('macbook di giulia', DEFAULT_DEVICES)?.id).toBe('d2');
    expect(findDevice('playstation', DEFAULT_DEVICES)?.id).toBe('d4');
    expect(findDevice('gianfranco', DEFAULT_DEVICES)?.id).toBe('d7');
    expect(findDevice('la tele', DEFAULT_DEVICES)?.id).toBe('d3');
  });

  it('nessun dispositivo se non citato', () => {
    expect(findDevice('ciao come va', DEFAULT_DEVICES)).toBeUndefined();
  });
});
