import { describe, expect, it } from 'vitest';
import {
  resolveDataSource,
  visibleForSource,
  visibleNotificationsForSource,
} from '@/lib/dataSeparation';

const DEMO = [
  { id: 'r1', vehicleId: 'veh-elantra-2018' },
  { id: 'r2', vehicleId: 'veh-corolla-2022' },
];
const REAL_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const liveIds = new Set([REAL_ID]);

describe('visibleForSource', () => {
  it('returns demo rows untouched in demo mode', () => {
    expect(visibleForSource(DEMO, 'demo', liveIds)).toHaveLength(2);
  });

  it('hides demo records for a real vehicle in live mode', () => {
    // The regression this guards against: a brand-new Supabase vehicle
    // inheriting the sample Elantra's oil-change history.
    expect(visibleForSource(DEMO, 'live', liveIds)).toHaveLength(0);
  });

  it('keeps records that belong to a real vehicle', () => {
    const rows = [...DEMO, { id: 'r3', vehicleId: REAL_ID }];
    const visible = visibleForSource(rows, 'live', liveIds);
    expect(visible.map((r) => r.id)).toEqual(['r3']);
  });

  it('drops records with no vehicle reference in live mode', () => {
    const rows = [{ id: 'orphan' }] as { id: string; vehicleId?: string }[];
    expect(visibleForSource(rows, 'live', liveIds)).toHaveLength(0);
  });
});

describe('visibleNotificationsForSource', () => {
  it('keeps system notifications (no vehicle) in live mode', () => {
    const rows = [
      { id: 'n1' },                          // system-wide
      { id: 'n2', vehicleId: 'veh-elantra-2018' }, // demo vehicle
      { id: 'n3', vehicleId: REAL_ID },       // real vehicle
    ];
    const visible = visibleNotificationsForSource(rows, 'live', liveIds);
    expect(visible.map((n) => n.id)).toEqual(['n1', 'n3']);
  });

  it('passes everything through in demo mode', () => {
    const rows = [{ id: 'n1' }, { id: 'n2', vehicleId: 'veh-elantra-2018' }];
    expect(visibleNotificationsForSource(rows, 'demo', liveIds)).toHaveLength(2);
  });
});

describe('resolveDataSource', () => {
  it('forces demo when Supabase is not configured', () => {
    expect(
      resolveDataSource({ liveAvailable: false, signedIn: true, preference: 'live' }),
    ).toBe('demo');
  });

  it('forces demo when signed out even if credentials exist', () => {
    expect(
      resolveDataSource({ liveAvailable: true, signedIn: false, preference: 'live' }),
    ).toBe('demo');
  });

  it('honours the preference once a real session exists', () => {
    expect(
      resolveDataSource({ liveAvailable: true, signedIn: true, preference: 'live' }),
    ).toBe('live');
    expect(
      resolveDataSource({ liveAvailable: true, signedIn: true, preference: 'demo' }),
    ).toBe('demo');
  });
});
