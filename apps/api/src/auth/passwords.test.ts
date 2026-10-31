import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from './passwords';

describe('contraseñas', () => {
  it('verifica la contraseña correcta y rechaza las demás', async () => {
    const stored = await hashPassword('clave-segura-123');
    expect(stored.startsWith('scrypt$')).toBe(true);
    expect(stored).not.toContain('clave-segura-123');
    expect(await verifyPassword('clave-segura-123', stored)).toBe(true);
    expect(await verifyPassword('otra-clave', stored)).toBe(false);
  });

  it('genera una sal distinta en cada hash', async () => {
    expect(await hashPassword('igual')).not.toBe(await hashPassword('igual'));
  });

  it('rechaza formatos desconocidos', async () => {
    expect(await verifyPassword('x', 'md5$abc')).toBe(false);
  });
});
