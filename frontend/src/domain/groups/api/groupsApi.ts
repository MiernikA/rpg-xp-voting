import { api } from '../../../shared/api/client';
import type { Group, GroupCreate } from '../../../types/api';

export const groupsApi = {
  groups: async () => (await api.get<Group[]>('/groups')).data,
  createGroup: async (data: GroupCreate) => (await api.post<Group>('/groups', data)).data,
  updateGroup: async (id: number, data: Partial<GroupCreate>) =>
    (await api.patch<Group>(`/groups/${id}`, data)).data,
  removeGroup: async (id: number) => {
    await api.delete(`/groups/${id}`);
  },
};
