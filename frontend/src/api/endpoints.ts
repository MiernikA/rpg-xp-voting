import { maintenanceApi } from '../domain/admin/api/maintenanceApi';
import { authApi } from '../domain/auth/api/authApi';
import { groupsApi } from '../domain/groups/api/groupsApi';
import { playersApi } from '../domain/players/api/playersApi';
import { profileApi } from '../domain/profile/api/profileApi';
import { resultsApi } from '../domain/results/api/resultsApi';
import { sessionsApi } from '../domain/sessions/api/sessionsApi';
import { statisticsApi } from '../domain/statistics/api/statisticsApi';
import { votingApi } from '../domain/voting/api/votingApi';

export const endpoints = {
  ...authApi,
  ...profileApi,
  ...groupsApi,
  ...playersApi,
  ...sessionsApi,
  ...votingApi,
  ...statisticsApi,
  ...resultsApi,
  ...maintenanceApi,
};
