
import { describe, expect, it } from 'vitest';
import {
  isValidSupabaseUrl,
  isServiceRoleKey,
  isValidPublicKey,
} from '../src/lib/supabase/client';

function createJwt(role: string): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = btoa(JSON.stringify({ role }));

  const base64Url = (value: string) =>
    value.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${base64Url(header)}.${base64Url(payload)}.fake-signature`;
}

describe('Supabase URL validation', () => {
  it('accepts a valid Supabase project URL', () => {
    expect(isValidSupabaseUrl('https://example.supabase.co')).toBe(true);
  });

  it('accepts a local development URL', () => {
    expect(isValidSupabaseUrl('http://localhost:54321')).toBe(true);
  });

  it('rejects REST endpoint URLs', () => {
    expect(
      isValidSupabaseUrl('https://example.supabase.co/rest/v1/'),
    ).toBe(false);
  });

  it('rejects invalid domains', () => {
    expect(isValidSupabaseUrl('https://example.com')).toBe(false);
  });

  it('rejects Supabase-like malicious domains', () => {
    expect(
      isValidSupabaseUrl('https://example.supabase.co.evil.com'),
    ).toBe(false);
  });

  it('rejects URLs with query strings', () => {
    expect(
      isValidSupabaseUrl('https://example.supabase.co?key=test'),
    ).toBe(false);
  });
});

describe('Supabase key validation', () => {
  it('accepts a publishable key', () => {
    expect(isValidPublicKey('sb_publishable_test123')).toBe(true);
  });

  it('rejects a secret key', () => {
    expect(isValidPublicKey('sb_secret_test123')).toBe(false);
  });

  it('rejects an invalid key format', () => {
    expect(isValidPublicKey('invalid-key')).toBe(false);
  });

  it('accepts a legacy anon JWT', () => {
    expect(isValidPublicKey(createJwt('anon'))).toBe(true);
  });

  it('rejects a legacy service-role JWT', () => {
    expect(isValidPublicKey(createJwt('service_role'))).toBe(false);
  });

  it('detects modern secret keys', () => {
    expect(isServiceRoleKey('sb_secret_test123')).toBe(true);
  });

  it('detects legacy service-role JWTs', () => {
    expect(isServiceRoleKey(createJwt('service_role'))).toBe(true);
  });

  it('does not classify publishable keys as secret keys', () => {
    expect(isServiceRoleKey('sb_publishable_test123')).toBe(false);
  });
});
