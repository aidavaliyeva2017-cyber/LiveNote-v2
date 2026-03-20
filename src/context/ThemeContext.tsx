import React, { createContext, useContext, useState, useCallback } from 'react';
import { colors as baseColors } from '../theme/colors';

export interface AppTheme {
  id: string;
  name: string;
  gradient: [string, string];
  primary: string;
  isDefault?: boolean;
}

export const THEMES: AppTheme[] = [
  {
    id: 'midnight',
    name: 'Midnight Blue',
    gradient: ['#09101F', '#0D1929'],
    primary: '#6B9FE4',
    isDefault: true,
  },
  {
    id: 'forest',
    name: 'Forest',
    gradient: ['#08120A', '#0C1E10'],
    primary: '#5BB37A',
  },
  {
    id: 'lavender',
    name: 'Lavender',
    gradient: ['#0F0A18', '#170F24'],
    primary: '#9A7BC8',
  },
  {
    id: 'teal',
    name: 'Petrol Teal',
    gradient: ['#07141A', '#0B2028'],
    primary: '#3ABDC0',
  },
  {
    id: 'mocha',
    name: 'Mocha',
    gradient: ['#150E09', '#201509'],
    primary: '#C49470',
  },
  {
    id: 'bordeaux',
    name: 'Bordeaux',
    gradient: ['#15080B', '#200A10'],
    primary: '#C46878',
  },
  {
    id: 'slate',
    name: 'Slate',
    gradient: ['#0C1014', '#131C22'],
    primary: '#8EA4BC',
  },
];

const GRAYSCALE_GRADIENT: [string, string] = ['#0A0A0A', '#171717'];
const GRAYSCALE_PRIMARY = '#8A8A8A';

/** Full grayscale color palette – mirrors baseColors but all hues removed */
export const grayscaleColors: typeof baseColors = {
  ...baseColors,
  primary:          '#888888',
  primaryDark:      '#666666',
  primaryLight:     '#BBBBBB',
  accent:           '#777777',
  accentYellow:     '#999999',
  success:          '#888888',
  warning:          '#888888',
  error:            '#666666',
  info:             '#777777',
  categoryWork:     '#555555',
  categoryPersonal: '#666666',
  categoryHealth:   '#555555',
  categorySocial:   '#666666',
  categoryErrands:  '#555555',
  categoryHobbies:  '#555555',
  background:       '#0A0A0A',
  surface:          '#1A1A1A',
  surfaceVariant:   '#252525',
  border:           '#333333',
  shadow:           'rgba(0,0,0,0.5)',
};

interface ThemeContextType {
  theme: AppTheme;
  isGrayscale: boolean;
  setThemeById: (id: string) => void;
  toggleGrayscale: () => void;
  /** Effective gradient – already accounts for grayscale mode */
  gradient: [string, string];
  /** Effective primary – already accounts for grayscale mode */
  primary: string;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState('midnight');
  const [isGrayscale, setIsGrayscale] = useState(false);

  const setThemeById  = useCallback((id: string) => setThemeId(id), []);
  const toggleGrayscale = useCallback(() => setIsGrayscale(v => !v), []);

  const theme   = THEMES.find(t => t.id === themeId) ?? THEMES[0];
  const gradient: [string, string] = isGrayscale ? GRAYSCALE_GRADIENT : theme.gradient;
  const primary  = isGrayscale ? GRAYSCALE_PRIMARY : theme.primary;

  return (
    <ThemeContext.Provider
      value={{ theme, isGrayscale, setThemeById, toggleGrayscale, gradient, primary }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}

/**
 * Returns the full color palette – grayscale when B&W mode is active.
 * Use this instead of importing `colors` directly in components that
 * should respond to the grayscale toggle.
 */
export function useColors() {
  const { isGrayscale } = useTheme();
  return isGrayscale ? grayscaleColors : baseColors;
}
