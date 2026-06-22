export const colorTokens = {
  primary: '#185c50',
  primaryContrast: '#ffffff',
  secondary: '#8b5cf6',
  secondaryContrast: '#ffffff',
  background: '#f7f8fb',
  surface: '#ffffff',
  textPrimary: '#111827',
  textSecondary: '#667085',
  subtleText: '#94a3b8',
  divider: '#e5e7eb',
  border: '#e6e8ef',
  gridLine: '#edf0f5',
  axisLine: '#cbd5e1',
  axisText: '#334155',
  muted: '#64748b',
  success: '#2e7d32',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#0ea5e9',
  chartLine: '#7c3aed',
  focusRing: 'rgba(24, 92, 80, 0.12)',
  shadow: 'rgba(17, 24, 39, 0.06)',
  shadowStrong: 'rgba(17, 24, 39, 0.10)',
  primaryShadow: 'rgba(24, 92, 80, 0.18)',
} as const;

export const radiusTokens = {
  sm: 6,
  md: 8,
  pill: 999,
} as const;

export const spacingTokens = {
  card: 28,
  compactCard: 14,
  controlHeight: 46,
  iconButton: 44,
} as const;

export const motionTokens = {
  fast: '160ms ease',
  normal: '180ms ease',
} as const;
