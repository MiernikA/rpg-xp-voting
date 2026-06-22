import { api } from '../../../shared/api/client';
import type { Player, VoteSubmission } from '../../../types/api';

export const votingApi = {
  recipients: async (sessionId: number) =>
    (await api.get<Player[]>('/votes/recipients', { params: { session_id: sessionId } })).data,
  voteStatus: async (sessionId: number) =>
    (await api.get<{ submitted: boolean }>(`/votes/${sessionId}/status`)).data,
  submitVotes: async (sessionId: number, data: VoteSubmission) => {
    await api.post(`/votes/${sessionId}/submit`, data);
  },
};
