export const Colors = {
  light: {
    primary: '#D52B1E',       // Canada red
    onPrimary: '#FFFFFF',
    secondary: '#1A1A1A',
    onSecondary: '#FFFFFF',
    accent: '#F5F5F5',
    background: '#FFFFFF',
    surface: '#FAFAFA',
    onSurface: '#1A1A1A',
    primaryText: '#1A1A1A',
    secondaryText: '#444444',
    hint: 'rgba(0,0,0,0.45)',
    error: '#B71C1C',
    divider: '#E0E0E0',
    transparent: 'transparent',
  },
  dark: {
    primary: '#FF453A',       // bright red for dark mode
    onPrimary: '#FFFFFF',
    secondary: '#F5F5F5',
    onSecondary: '#1A1A1A',
    accent: '#FF453A',
    background: '#0D0D0D',
    surface: '#1C1C1C',
    onSurface: '#F5F5F5',
    primaryText: '#F5F5F5',
    secondaryText: '#CCCCCC',
    hint: 'rgba(245,245,245,0.45)',
    error: '#FF453A',
    divider: '#333333',
    transparent: 'transparent',
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 32,
  xl: 64,
};

export const Fonts = {
  bebasNeue: 'BebasNeue_400Regular',
  interRegular: 'System',
  interBold: 'System',
};

export const TextStyles = {
  headlineLarge:  { fontSize: 34, fontWeight: '700' as const, lineHeight: 34 },
  headlineMedium: { fontSize: 28, fontWeight: '700' as const, lineHeight: 28 },
  headlineSmall:  { fontSize: 22, fontWeight: '700' as const, lineHeight: 24 },
  titleLarge:     { fontSize: 22, fontWeight: '700' as const, lineHeight: 24 },
  titleMedium:    { fontSize: 17, fontWeight: '700' as const, lineHeight: 19 },
  bodyLarge:      { fontSize: 17, fontWeight: '700' as const, lineHeight: 20 },
  bodyMedium:     { fontSize: 15, fontWeight: '700' as const, lineHeight: 18 },
  bodySmall:      { fontSize: 13, fontWeight: '700' as const, lineHeight: 16 },
  labelLarge:     { fontSize: 15, fontWeight: '700' as const, lineHeight: 15 },
  labelMedium:    { fontSize: 13, fontWeight: '700' as const, lineHeight: 13 },
  labelSmall:     { fontSize: 11, fontWeight: '700' as const, lineHeight: 11 },
};
