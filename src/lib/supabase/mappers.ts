import type { Vehicle, FuelType, Transmission } from '@/types';
import type { VehicleRow } from '@/types/database';
import { asset } from '@/utils/asset';

const FALLBACK_IMAGES = [
  asset('/images/car-elantra.jpg'),
  asset('/images/car-corolla.jpg'),
  asset('/images/car-sportage.jpg'),
];

const FUELS: FuelType[] = ['petrol', 'diesel', 'hybrid', 'electric'];
const TRANSMISSIONS: Transmission[] = ['automatic', 'manual', 'cvt'];

function oneOf<T extends string>(allowed: T[], value: string | null, fallback: T): T {
  return value && (allowed as string[]).includes(value) ? (value as T) : fallback;
}

/**
 * The database row is intentionally sparse compared to the richer demo
 * `Vehicle` shape (no engine block, no drivetrain, no purchase date).
 *
 * We fill the gaps with explicit, honest defaults rather than inventing
 * specifications the user never entered. Screens that rely on those fields
 * already render "—" for unknown values.
 */
export function rowToVehicle(row: VehicleRow, index = 0): Vehicle {
  return {
    id: row.id,
    make: row.make,
    model: row.model,
    year: row.year,
    trim: row.trim ?? undefined,
    plate: row.license_plate ?? '—',
    color: '—',
    vin: row.vin ?? '—',
    mileage: row.mileage,
    image: row.photo_url || FALLBACK_IMAGES[index % FALLBACK_IMAGES.length],
    fuelType: oneOf(FUELS, row.fuel_type, 'petrol'),
    transmission: oneOf(TRANSMISSIONS, row.transmission, 'automatic'),
    drivetrain: 'fwd',
    category: 'sedan',
    engine: {
      displacement: row.engine_capacity ?? '—',
      cylinders: 0,
      power: '—',
      torque: '—',
      oilSpec: '—',
    },
    purchaseDate: row.created_at.slice(0, 10),
    isPrimary: row.is_primary,
    // A brand-new user-entered vehicle has no verification history yet.
    verification: 'owner_reported',
    averageMonthlyKm: 0,
  };
}

export interface VehicleWriteInput {
  make: string;
  model: string;
  year: number;
  trim?: string | null;
  mileage: number;
  transmission?: string | null;
  fuelType?: string | null;
  licensePlate?: string | null;
  vin?: string | null;
  photoUrl?: string | null;
}

/** Map the form's camelCase payload onto the snake_case columns. */
export function vehicleToRow(input: VehicleWriteInput) {
  return {
    make: input.make.trim(),
    model: input.model.trim(),
    year: input.year,
    trim: input.trim?.trim() || null,
    mileage: input.mileage,
    transmission: input.transmission ?? null,
    fuel_type: input.fuelType ?? null,
    license_plate: input.licensePlate?.trim() || null,
    vin: input.vin?.trim() || null,
    photo_url: input.photoUrl ?? null,
  };
}
