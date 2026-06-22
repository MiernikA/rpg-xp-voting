import { api } from '../../../shared/api/client';

export const maintenanceApi = {
  backupCsv: async () => (await api.get<Blob>('/maintenance/backup.csv', { responseType: 'blob' })).data,
  purgeSystem: async (confirmation: string) => {
    await api.post('/maintenance/purge', { confirmation });
  },
  restoreBackup: async (file: File) => {
    const data = new FormData();
    data.append('file', file);
    await api.post('/maintenance/restore', data, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
