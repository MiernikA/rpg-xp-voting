import { api } from '../../../shared/api/client';
import type { DashboardStats, Statistics } from '../../../types/api';

export const statisticsApi = {
  dashboard: async () => (await api.get<DashboardStats>('/statistics/dashboard')).data,
  statistics: async () => (await api.get<Statistics>('/statistics')).data,
};
