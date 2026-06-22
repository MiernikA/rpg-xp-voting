import { api } from '../../../shared/api/client';
import type {
  CommentRead,
  GMSessionView,
  PublishedSessionResults,
  ResultRow,
} from '../../../types/api';

export const resultsApi = {
  results: async (sessionId: number) =>
    (await api.get<ResultRow[]>(`/results/${sessionId}`)).data,
  gmSessionView: async (sessionId: number) =>
    (await api.get<GMSessionView>(`/results/${sessionId}/gm-view`)).data,
  publishedResults: async () =>
    (await api.get<PublishedSessionResults[]>('/results/published')).data,
  comments: async (params: Record<string, string | number | undefined>) =>
    (await api.get<CommentRead[]>('/results/comments/search', { params })).data,
};
