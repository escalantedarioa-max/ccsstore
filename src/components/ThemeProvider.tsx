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

const THEME_CLASS_MAP: Partial<Record<StoreTheme, string>> = {
  dama: 'theme-women',
  caballero: 'theme-men',
  ninos: 'theme-kids',
  hogar: 'theme-home',
};

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
    const html = document.documentElement;
    html.setAttribute('data-theme', theme);
    ['theme-women', 'theme-men', 'theme-kids', 'theme-home'].forEach((c) => html.classList.remove(c));
    const themeClass = THEME_CLASS_MAP[theme];
    if (themeClass) html.classList.add(themeClass);
  }, [theme]);

  return <>{children}</>;
}
