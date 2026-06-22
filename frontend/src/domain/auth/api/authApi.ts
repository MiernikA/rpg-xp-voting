import { api } from '../../../shared/api/client';
import type { LoginRequest, TokenPair } from '../../../types/api';

export const authApi = {
  login: async (data: LoginRequest) => (await api.post<TokenPair>('/auth/login', data)).data,
};
