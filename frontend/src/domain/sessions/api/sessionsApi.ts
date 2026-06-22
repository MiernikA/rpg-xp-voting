import { api } from '../../../shared/api/client';
import type { SessionProgress, VotingSession, VotingSessionCreate } from '../../../types/api';

export const sessionsApi = {
  sessions: async (params?: { group_id?: number }) =>
    (await api.get<VotingSession[]>('/sessions', { params })).data,
  activeSession: async () => (await api.get<VotingSession | null>('/sessions/active')).data,
  createSession: async (data: VotingSessionCreate) =>
    (await api.post<VotingSession>('/sessions', data)).data,
  activateSession: async (id: number) =>
    (await api.post<VotingSession>(`/sessions/${id}/activate`)).data,
  closeSession: async (id: number) =>
    (await api.post<VotingSession>(`/sessions/${id}/close`)).data,
  publishResults: async (id: number) =>
    (await api.post<VotingSession>(`/sessions/${id}/publish-results`)).data,
  archiveResults: async (id: number) =>
    (await api.post<VotingSession>(`/sessions/${id}/archive-results`)).data,
  removeSession: async (id: number) => {
    await api.delete(`/sessions/${id}`);
  },
  progress: async (id: number) => (await api.get<SessionProgress>(`/sessions/${id}/progress`)).data,
};
