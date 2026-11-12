import { describe, expect, it } from 'vitest';
import { daysUntil, formatCurrency, formatFileSize, formatNumber } from '@/utils/format';
import { maintenanceHealth, recordTitle, upcomingRecords, vehicleLabel } from '@/utils/vehicle';
import { DEMO_RECORDS, DEMO_VEHICLES } from '@/data/mockData';

describe('formatting helpers', () => {
  it('formats EGP amounts in both languages', () => {
    expect(formatCurrency(1850, 'en')).toBe('1,850 EGP');
    expect(formatCurrency(1850, 'ar')).toContain('ج.م');
  });

  it('formats numbers with Western digits in Arabic too', () => {
    expect(formatNumber(128450, 'ar')).toBe('128,450');
    expect(formatNumber(128450, 'en')).toBe('128,450');
  });

  it('formats file sizes', () => {
    expect(formatFileSize(214)).toBe('214 KB');
    expect(formatFileSize(2048)).toBe('2.0 MB');
  });

  it('calculates day differences', () => {
    const future = new Date(Date.now() + 3 * 86_400_000).toISOString();
    expect(daysUntil(future)).toBe(3);
  });
});

describe('vehicle helpers', () => {
  const vehicle = DEMO_VEHICLES[0];

  it('builds a vehicle label', () => {
    expect(vehicleLabel(vehicle)).toBe('Hyundai Elantra 2018');
  });

  it('picks the localised record title', () => {
    const record = DEMO_RECORDS[0];
    expect(recordTitle(record, 'en')).toBe(record.title);
    expect(recordTitle(record, 'ar')).toBe(record.titleAr);
  });

  it('reports maintenance health from record statuses', () => {
    const records = DEMO_RECORDS.filter((r) => r.vehicleId === vehicle.id);
    const health = maintenanceHealth(records);
    expect(health.overdueCount).toBe(1);
    expect(health.level).toBe('attention');
  });

  it('sorts upcoming records by date', () => {
    const records = DEMO_RECORDS.filter((r) => r.vehicleId === vehicle.id);
    const upcoming = upcomingRecords(records, 5);
    expect(upcoming.length).toBeGreaterThan(0);
    const dates = upcoming.map((r) => new Date(r.date).getTime());
    expect([...dates].sort((a, b) => a - b)).toEqual(dates);
  });
});

describe('demo data integrity', () => {
  it('has three realistic vehicles with unique ids and images', () => {
    expect(DEMO_VEHICLES).toHaveLength(3);
    expect(new Set(DEMO_VEHICLES.map((v) => v.id)).size).toBe(3);
    DEMO_VEHICLES.forEach((vehicle) => {
      expect(vehicle.mileage).toBeGreaterThan(0);
      expect(vehicle.image.startsWith('/images/')).toBe(true);
    });
  });

  it('references only existing vehicles from records', () => {
    const ids = new Set(DEMO_VEHICLES.map((v) => v.id));
    DEMO_RECORDS.forEach((record) => expect(ids.has(record.vehicleId)).toBe(true));
  });

  it('has Arabic titles for every record', () => {
    DEMO_RECORDS.forEach((record) => expect(record.titleAr.length).toBeGreaterThan(3));
  });
});
