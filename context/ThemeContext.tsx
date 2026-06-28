import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeType = 'dark' | 'light' | 'ocean' | 'forest';

interface ThemeColors {
  bgPrimary: string;
  bgCard: string;
  bgInput: string;
  bgTabBar: string;
  bgModal: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  purple: string;
  green: string;
  red: string;
  border: string;
  tabActive: string;
  tabInactive: string;
  greenBg: string;
  redBg: string;
  blueBright: string;
  yellow: string;
}

const THEMES: Record<ThemeType, ThemeColors> = {
  dark: {
    bgPrimary: '#0f0d2e',
    bgCard: '#1a1744',
    bgInput: '#231f54',
    bgTabBar: '#161438',
    bgModal: '#120f30',
    textPrimary: '#ffffff',
    textSecondary: '#9e9cb8',
    textMuted: '#6b6991',
    purple: '#7c5cfc',
    green: '#00e676',
    red: '#ff5252',
    border: '#2a2660',
    tabActive: '#7c5cfc',
    tabInactive: '#6b6991',
    greenBg: 'rgba(0, 230, 118, 0.15)',
    redBg: 'rgba(255, 82, 82, 0.15)',
    blueBright: '#7c8cf8',
    yellow: '#ffd600',
  },
  light: {
    bgPrimary: '#f8fafc',
    bgCard: '#ffffff',
    bgInput: '#f1f5f9',
    bgTabBar: '#ffffff',
    bgModal: '#ffffff',
    textPrimary: '#0f172a',
    textSecondary: '#64748b',
    textMuted: '#94a3b8',
    purple: '#4f46e5',
    green: '#10b981',
    red: '#ef4444',
    border: '#e2e8f0',
    tabActive: '#4f46e5',
    tabInactive: '#94a3b8',
    greenBg: 'rgba(16, 185, 129, 0.1)',
    redBg: 'rgba(239, 68, 68, 0.1)',
    blueBright: '#3b82f6',
    yellow: '#f59e0b',
  },
  ocean: {
    bgPrimary: '#0f172a',
    bgCard: '#1e293b',
    bgInput: '#334155',
    bgTabBar: '#0f172a',
    bgModal: '#1e293b',
    textPrimary: '#f8fafc',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    purple: '#0ea5e9',
    green: '#10b981',
    red: '#f43f5e',
    border: '#334155',
    tabActive: '#0ea5e9',
    tabInactive: '#64748b',
    greenBg: 'rgba(16, 185, 129, 0.15)',
    redBg: 'rgba(244, 63, 94, 0.15)',
    blueBright: '#3b82f6',
    yellow: '#eab308',
  },
  forest: {
    bgPrimary: '#14532d',
    bgCard: '#166534',
    bgInput: '#15803d',
    bgTabBar: '#14532d',
    bgModal: '#166534',
    textPrimary: '#f0fdf4',
    textSecondary: '#86efac',
    textMuted: '#4ade80',
    purple: '#22c55e',
    green: '#a3e635',
    red: '#f87171',
    border: '#15803d',
    tabActive: '#f0fdf4',
    tabInactive: '#4ade80',
    greenBg: 'rgba(163, 230, 53, 0.2)',
    redBg: 'rgba(248, 113, 113, 0.2)',
    blueBright: '#38bdf8',
    yellow: '#fde047',
  }
};

type CurrencyFormat = 'IDR' | 'USD';

interface ThemeContextType {
  theme: ThemeType;
  colors: ThemeColors;
  setTheme: (theme: ThemeType) => void;
  currency: CurrencyFormat;
  setCurrency: (currency: CurrencyFormat) => void;
  formatCurrency: (amount: number) => string;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeType>('dark');
  const [currency, setCurrencyState] = useState<CurrencyFormat>('IDR');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem('app_theme');
        if (storedTheme) setThemeState(storedTheme as ThemeType);
        
        const storedCurrency = await AsyncStorage.getItem('app_currency');
        if (storedCurrency) setCurrencyState(storedCurrency as CurrencyFormat);
      } catch (e) {
        console.error('Failed to load settings', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  const setTheme = async (newTheme: ThemeType) => {
    setThemeState(newTheme);
    await AsyncStorage.setItem('app_theme', newTheme);
  };

  const setCurrency = async (newCurrency: CurrencyFormat) => {
    setCurrencyState(newCurrency);
    await AsyncStorage.setItem('app_currency', newCurrency);
  };

  const formatCurrency = (amount: number) => {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);
    }
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  };

  if (!isLoaded) return null; // or a loading spinner

  return (
    <ThemeContext.Provider value={{ theme, colors: THEMES[theme], setTheme, currency, setCurrency, formatCurrency }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
};
