/** Centralised TanStack Query keys — one place to audit cache invalidation. */
export const vehicleKeys = {
  all: ['vehicles'] as const,
  list: () => [...vehicleKeys.all, 'list'] as const,
  detail: (id: string) => [...vehicleKeys.all, 'detail', id] as const,
};

export const profileKeys = {
  all: ['profile'] as const,
  current: (userId: string | undefined) => [...profileKeys.all, userId ?? 'anon'] as const,
};
