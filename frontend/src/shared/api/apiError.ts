import { AxiosError } from 'axios';

interface ValidationError {
  loc?: Array<string | number>;
  msg?: string;
}

interface ErrorResponse {
  detail?: string | ValidationError[];
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && !(error instanceof AxiosError)) {
    return error.message || fallback;
  }

  if (!(error instanceof AxiosError)) {
    return fallback;
  }

  const data = error.response?.data as ErrorResponse | undefined;
  if (!data?.detail) {
    return fallback;
  }

  if (typeof data.detail === 'string') {
    return data.detail;
  }

  return data.detail
    .map((item) => {
      const field = item.loc?.filter((part) => part !== 'body').join('.');
      return field ? `${field}: ${item.msg}` : item.msg;
    })
    .filter(Boolean)
    .join(' ');
}
