import { describe, expect, it } from 'vitest';
import { sanitize, defaultSettings } from '../src/core/settings';

describe('sanitize', () => {
  it('mantiene i dispositivi salvati', () => {
    const s = sanitize({ boot: false, devices: [{ id: 'd1', name: 'Telefono di Marco', type: 'phone' }] });
    expect(s.boot).toBe(false);
    expect(s.devices).toEqual([{ id: 'd1', name: 'Telefono di Marco', type: 'phone' }]);
  });

  it('scarta i dispositivi non validi e i valori fuori scala', () => {
    const s = sanitize({ typingSpeed: 99, theme: 'viola', devices: [{ id: 1, name: 'x', type: 'phone' }, { id: 'a', name: 'ok', type: 'astronave' }] });
    expect(s.typingSpeed).toBe(defaultSettings().typingSpeed);
    expect(s.theme).toBe('dark');
    expect(s.devices).toEqual([]);
  });

  it('dati rotti tornano ai valori predefiniti', () => {
    expect(sanitize('boh')).toEqual(defaultSettings());
  });
});
