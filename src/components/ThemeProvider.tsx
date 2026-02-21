import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import type { StoreTheme } from '@/types/database';

const VALID_THEMES: StoreTheme[] = [
  'moderno',
  'clasico',
  'dama',
  'caballero',
  'ninos',
  'mixto',
  'lenceria',
  'hogar',
];

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const { data: settings } = useStoreSettings();
  const isAdmin = pathname.startsWith('/admin') || pathname === '/auth';
  const rawTheme = settings?.theme ? String(settings.theme).toLowerCase() : null;
  const theme: StoreTheme =
    isAdmin
      ? 'moderno'
      : rawTheme && VALID_THEMES.includes(rawTheme as StoreTheme)
        ? (rawTheme as StoreTheme)
        : 'moderno';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return <>{children}</>;
}
