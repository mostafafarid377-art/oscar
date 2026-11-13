import { QueryClient } from '@tanstack/react-query';

/**
 * Shared Query client. Modest defaults: vehicle data is small and changes only
 * when the user acts, so a 30s stale window avoids needless refetches while
 * still surfacing another device's edits reasonably quickly.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});
