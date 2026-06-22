import { createTheme } from '@mui/material/styles';

import { colorTokens, motionTokens, radiusTokens, spacingTokens } from './tokens';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: colorTokens.primary, contrastText: colorTokens.primaryContrast },
    secondary: { main: colorTokens.secondary, contrastText: colorTokens.secondaryContrast },
    background: { default: colorTokens.background, paper: colorTokens.surface },
    text: { primary: colorTokens.textPrimary, secondary: colorTokens.textSecondary },
    divider: colorTokens.divider,
  },
  shape: {
    borderRadius: radiusTokens.md,
  },
  typography: {
    fontFamily: ['Inter', 'Roboto', 'Arial', 'sans-serif'].join(','),
    h1: { fontSize: '2.25rem', lineHeight: 1.08, fontWeight: 850, letterSpacing: 0 },
    h2: { fontSize: '1.7rem', lineHeight: 1.18, fontWeight: 820, letterSpacing: 0 },
    h3: { fontSize: '1.12rem', lineHeight: 1.28, fontWeight: 760, letterSpacing: 0 },
    h4: { fontSize: '1rem', lineHeight: 1.35, fontWeight: 730, letterSpacing: 0 },
    body1: { lineHeight: 1.55, letterSpacing: 0 },
    body2: { lineHeight: 1.45, letterSpacing: 0 },
    button: { textTransform: 'none', fontWeight: 760, letterSpacing: 0 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          textRendering: 'optimizeLegibility',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: spacingTokens.controlHeight,
          borderRadius: radiusTokens.md,
          boxShadow: 'none',
          transition: `transform ${motionTokens.fast}, box-shadow ${motionTokens.fast}, background-color ${motionTokens.fast}`,
          '&:hover': {
            boxShadow: `0 10px 22px ${colorTokens.shadowStrong}`,
            transform: 'translateY(-1px)',
          },
          '&.Mui-disabled': {
            boxShadow: 'none',
            transform: 'none',
          },
        },
        contained: {
          boxShadow: `0 10px 22px ${colorTokens.primaryShadow}`,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          minWidth: spacingTokens.iconButton,
          minHeight: spacingTokens.iconButton,
          transition: `transform ${motionTokens.fast}, background-color ${motionTokens.fast}`,
          '&:hover': { transform: 'translateY(-1px)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderColor: colorTokens.border,
          boxShadow: `0 14px 36px ${colorTokens.shadow}`,
          transition: `transform ${motionTokens.normal}, box-shadow ${motionTokens.normal}, border-color ${motionTokens.normal}`,
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: spacingTokens.card,
          '&:last-child': { paddingBottom: spacingTokens.card },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderColor: colorTokens.border,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: radiusTokens.md,
          backgroundColor: colorTokens.surface,
          transition: `box-shadow ${motionTokens.fast}, border-color ${motionTokens.fast}`,
          '&.Mui-focused': {
            boxShadow: `0 0 0 4px ${colorTokens.focusRing}`,
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: radiusTokens.md,
          border: '1px solid',
          boxShadow: `0 10px 24px ${colorTokens.shadow}`,
        },
      },
    },
  },
});
