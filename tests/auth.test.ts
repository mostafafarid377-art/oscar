import { describe, expect, it } from 'vitest';
import { isServiceRoleKey } from '@/lib/supabase/client';
import { rowToVehicle, vehicleToRow } from '@/lib/supabase/mappers';
import type { VehicleRow } from '@/types/database';

/** Build a JWT-shaped string with an arbitrary payload. */
function fakeJwt(payload: Record<string, unknown>): string {
  const b64 = (o: unknown) =>
    btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.signature`;
}

describe('isServiceRoleKey', () => {
  it('detects a service_role JWT so the app can refuse to start', () => {
    expect(isServiceRoleKey(fakeJwt({ role: 'service_role' }))).toBe(true);
  });

  it('accepts an anon key', () => {
    expect(isServiceRoleKey(fakeJwt({ role: 'anon' }))).toBe(false);
  });

  it('does not throw on malformed input', () => {
    expect(isServiceRoleKey('not-a-jwt')).toBe(false);
    expect(isServiceRoleKey('')).toBe(false);
    expect(isServiceRoleKey('a.b.c')).toBe(false);
  });
});

const baseRow: VehicleRow = {
  id: 'veh-1',
  owner_id: 'user-1',
  make: 'Hyundai',
  model: 'Elantra',
  year: 2018,
  trim: null,
  engine_type: null,
  engine_capacity: null,
  transmission: 'automatic',
  fuel_type: 'petrol',
  mileage: 128450,
  photo_url: null,
  license_plate: '4821',
  vin: null,
  is_primary: true,
  created_at: '2026-01-15T10:00:00.000Z',
  updated_at: '2026-01-15T10:00:00.000Z',
};

describe('rowToVehicle', () => {
  it('maps snake_case columns onto the domain shape', () => {
    const v = rowToVehicle(baseRow);
    expect(v.make).toBe('Hyundai');
    expect(v.mileage).toBe(128450);
    expect(v.plate).toBe('4821');
    expect(v.isPrimary).toBe(true);
  });

  it('does not invent verification history for a real vehicle', () => {
    // A user-entered car has no documented history, so it must never claim
    // a higher verification level than "owner reported".
    expect(rowToVehicle(baseRow).verification).toBe('owner_reported');
  });

  it('uses a placeholder instead of fabricating unknown identifiers', () => {
    const v = rowToVehicle(baseRow);
    expect(v.vin).toBe('—');
    expect(v.color).toBe('—');
    expect(v.engine.power).toBe('—');
  });

  it('falls back safely on unexpected enum values', () => {
    const v = rowToVehicle({ ...baseRow, fuel_type: 'nuclear', transmission: 'rocket' });
    expect(v.fuelType).toBe('petrol');
    expect(v.transmission).toBe('automatic');
  });

  it('prefers a stored photo url over the bundled fallback', () => {
    const v = rowToVehicle({ ...baseRow, photo_url: 'https://cdn.example/car.jpg' });
    expect(v.image).toBe('https://cdn.example/car.jpg');
  });
});

describe('vehicleToRow', () => {
  it('trims text and converts empty strings to null', () => {
    const row = vehicleToRow({
      make: '  Toyota ',
      model: ' Corolla ',
      year: 2022,
      mileage: 41200,
      trim: '',
      licensePlate: '  ',
      vin: '',
    });
    expect(row.make).toBe('Toyota');
    expect(row.model).toBe('Corolla');
    expect(row.trim).toBeNull();
    expect(row.license_plate).toBeNull();
    expect(row.vin).toBeNull();
  });

  it('never emits an owner_id (ownership is server-enforced)', () => {
    const row = vehicleToRow({ make: 'Kia', model: 'Sportage', year: 2021, mileage: 1 });
    expect('owner_id' in row).toBe(false);
  });
});
