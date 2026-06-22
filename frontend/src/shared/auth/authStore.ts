import type { TokenPair } from '../../types/api';

const key = 'rpg-xp-voting-auth';

export const authStore = {
  get(): TokenPair | null {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as TokenPair;
    } catch {
      localStorage.removeItem(key);
      return null;
    }
  },
  set(value: TokenPair): void {
    localStorage.setItem(key, JSON.stringify(value));
  },
  clear(): void {
    localStorage.removeItem(key);
  },
};

export const authEvents = {
  cleared: 'rpg-xp-voting-auth-cleared',
};
