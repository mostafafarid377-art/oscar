import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthProvider';
import { IS_BACKEND_CONNECTED } from '@/lib/supabase';
import type { VehicleWriteInput } from '@/lib/supabase/mappers';
import { rowToVehicle } from '@/lib/supabase/mappers';
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  setPrimaryVehicle,
  updateVehicle,
} from './vehiclesApi';
import { vehicleKeys } from './queryKeys';

/**
 * Vehicle queries are only enabled when a real Supabase session exists.
 * In demo mode (no credentials, or signed out) the calling screen keeps using
 * the localStorage demo store instead.
 */
function useRealVehicleQuery() {
  const { status } = useAuth();
  const enabled = IS_BACKEND_CONNECTED && status === 'signed_in';

  return useQuery({
    queryKey: vehicleKeys.list(),
    queryFn: listVehicles,
    enabled,
    staleTime: 30_000,
  });
}

export function useVehicles() {
  const query = useRealVehicleQuery();
  return {
    vehicles: (query.data ?? []).map((row, i) => rowToVehicle(row, i)),
    rows: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error as Error | null,
    refetch: query.refetch,
    isEnabled: query.isFetched,
  };
}

function useInvalidateVehicles() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: vehicleKeys.all });
}

export function useCreateVehicle() {
  const invalidate = useInvalidateVehicles();
  return useMutation({
    mutationFn: (input: VehicleWriteInput) => createVehicle(input),
    onSuccess: () => void invalidate(),
  });
}

export function useUpdateVehicle() {
  const invalidate = useInvalidateVehicles();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: VehicleWriteInput }) =>
      updateVehicle(id, input),
    onSuccess: () => void invalidate(),
  });
}

export function useDeleteVehicle() {
  const invalidate = useInvalidateVehicles();
  return useMutation({
    mutationFn: (id: string) => deleteVehicle(id),
    onSuccess: () => void invalidate(),
  });
}

export function useSetPrimaryVehicle() {
  const invalidate = useInvalidateVehicles();
  return useMutation({
    mutationFn: (id: string) => setPrimaryVehicle(id),
    onSuccess: () => void invalidate(),
  });
}
