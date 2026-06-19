import { afterEach, describe, expect, it } from 'vitest';
import { DEFAULT_REGISTRY, resolveRegistry } from './config.js';

const original = process.env.PKG_REGISTRY_URL;

afterEach(() => {
  if (original === undefined) Reflect.deleteProperty(process.env, 'PKG_REGISTRY_URL');
  else process.env.PKG_REGISTRY_URL = original;
});

describe('resolveRegistry', () => {
  it('prefers the explicit flag', () => {
    process.env.PKG_REGISTRY_URL = 'https://env.dev';
    expect(resolveRegistry('https://flag.dev')).toBe('https://flag.dev');
  });

  it('falls back to the env var', () => {
    process.env.PKG_REGISTRY_URL = 'https://env.dev';
    expect(resolveRegistry()).toBe('https://env.dev');
  });

  it('falls back to the built-in default', () => {
    Reflect.deleteProperty(process.env, 'PKG_REGISTRY_URL');
    expect(resolveRegistry()).toBe(DEFAULT_REGISTRY);
  });
});
