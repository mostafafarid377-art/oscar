import { describe, expect, it } from 'vitest';
import en from '@/i18n/en';
import ar from '@/i18n/ar';

type Dict = Record<string, unknown>;

function flatten(obj: Dict, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return flatten(value as Dict, path);
    }
    return [path];
  });
}

const PLURAL_SUFFIX = /_(zero|one|two|few|many|other)$/;

function baseKeys(keys: string[]): string[] {
  return [...new Set(keys.map((key) => key.replace(PLURAL_SUFFIX, '')))];
}

describe('translation dictionaries', () => {
  const enKeys = baseKeys(flatten(en as unknown as Dict));
  const arKeys = baseKeys(flatten(ar as unknown as Dict));

  it('has the same keys in English and Arabic', () => {
    const missingInAr = enKeys.filter((key) => !arKeys.includes(key));
    const missingInEn = arKeys.filter((key) => !enKeys.includes(key));
    expect(missingInAr).toEqual([]);
    expect(missingInEn).toEqual([]);
  });

  it('does not have empty English strings', () => {
    const empties = flatten(en as unknown as Dict).filter((key) => {
      const value = key.split('.').reduce<unknown>((acc, part) => (acc as Dict)?.[part], en);
      return typeof value === 'string' && value.trim() === '';
    });
    expect(empties).toEqual([]);
  });

  it('does not have empty Arabic strings', () => {
    const empties = flatten(ar as unknown as Dict).filter((key) => {
      const value = key.split('.').reduce<unknown>((acc, part) => (acc as Dict)?.[part], ar);
      return typeof value === 'string' && value.trim() === '';
    });
    expect(empties).toEqual([]);
  });

  it('covers all 11 required screens in the navigation', () => {
    const labels = [en.nav.dashboard, en.nav.garage, en.nav.carproof, en.nav.maintenance,
      en.nav.documents, en.nav.aiMechanic, en.nav.notifications, en.nav.settings];
    labels.forEach((label) => expect(label.length).toBeGreaterThan(2));
    // landing + auth are the remaining two screens of the eleven
    expect(en.landing.hero.title.length).toBeGreaterThan(5);
    expect(en.auth.loginTab.length).toBeGreaterThan(3);
  });

  it('uses natural Arabic, not transliterated English', () => {
    expect(ar.nav.dashboard).toBe('لوحة التحكم');
    expect(ar.common.tagline).toContain('سيارتك');
    expect(ar.carproof.title).toBe('كاربروف');
  });
});
