import { api } from '../../../shared/api/client';
import type { MyInfo, Player } from '../../../types/api';

export const profileApi = {
  me: async () => (await api.get<MyInfo>('/me')).data,
  updateMe: async (data: {
    display_name?: string;
    avatar_url?: string | null;
    theme_primary?: string;
    theme_secondary?: string;
    theme_background?: string;
    theme_paper?: string;
  }) => (await api.patch<Player>('/me', data)).data,
};
