/**
 * Hand-written mirror of the SQL schema in `supabase/migrations`.
 *
 * Regenerate with the Supabase CLI once the project exists:
 *   supabase gen types typescript --project-id <ref> > src/types/database.ts
 * Keeping it hand-written lets the app type-check with no live project.
 */

export type VehicleMemberRole = 'viewer' | 'mechanic';
export type PreferredLanguage = 'en' | 'ar';

export type ProfileRow = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_language: PreferredLanguage;
  created_at: string;
  updated_at: string;
}

export type VehicleRow = {
  id: string;
  owner_id: string;
  make: string;
  model: string;
  year: number;
  trim: string | null;
  engine_type: string | null;
  engine_capacity: string | null;
  transmission: string | null;
  fuel_type: string | null;
  mileage: number;
  photo_url: string | null;
  license_plate: string | null;
  vin: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
}

export type VehicleMemberRow = {
  id: string;
  vehicle_id: string;
  user_id: string;
  role: VehicleMemberRole;
  created_at: string;
}

/**
 * Build an Insert shape: all columns present, except generated ones which
 * become optional. Written out explicitly (rather than via a mapped helper)
 * because postgrest-js resolves these structurally and silently degrades
 * to `never` if the shape is too clever.
 */
type InsertOf<Row, Generated extends keyof Row> = {
  // Required columns stay required…
  [K in Exclude<keyof Row, Generated> as null extends Row[K] ? never : K]: Row[K];
} & {
  // …null-defaulted and generated columns may be omitted.
  [K in Exclude<keyof Row, Generated> as null extends Row[K] ? K : never]?: Row[K];
} & {
  [K in Generated]?: Row[K];
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: InsertOf<ProfileRow, 'created_at' | 'updated_at' | 'preferred_language'>;
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at'>>;
        Relationships: [];
      };
      vehicles: {
        Row: VehicleRow;
        Insert: InsertOf<VehicleRow, 'id' | 'created_at' | 'updated_at' | 'is_primary' | 'mileage'>;
        Update: Partial<
          Omit<VehicleRow, 'id' | 'owner_id' | 'created_at' | 'updated_at'>
        >;
        Relationships: [];
      };
      vehicle_members: {
        Row: VehicleMemberRow;
        Insert: InsertOf<VehicleMemberRow, 'id' | 'created_at' | 'role'>;
        Update: Partial<Pick<VehicleMemberRow, 'role'>>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_vehicle_owner: { Args: { p_vehicle_id: string }; Returns: boolean };
      is_vehicle_member: { Args: { p_vehicle_id: string }; Returns: boolean };
      set_primary_vehicle: { Args: { p_vehicle_id: string }; Returns: undefined };
    };
    Enums: { vehicle_member_role: VehicleMemberRole };
    CompositeTypes: Record<string, never>;
  };
}
