import { api } from '../../../shared/api/client';
import type { Player, PlayerCreate } from '../../../types/api';

export const playersApi = {
  players: async () => (await api.get<Player[]>('/players')).data,
  createPlayer: async (data: PlayerCreate) => (await api.post<Player>('/players', data)).data,
  updatePlayer: async (id: number, data: Partial<Player>) =>
    (await api.patch<Player>(`/players/${id}`, data)).data,
  removePlayer: async (id: number) => {
    await api.delete(`/players/${id}`);
  },
  resetPlayerPassword: async (id: number, password: string) => {
    await api.post(`/players/${id}/reset-password`, { password });
  },
};
