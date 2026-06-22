import { useQuery } from '@tanstack/react-query';

import { endpoints } from '../api/endpoints';

export function useActiveSession() {
  return useQuery({
    queryKey: ['active-session'],
    queryFn: endpoints.activeSession,
  });
}
