import { ReactNode, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { AppContext, type AppConfig, type AppContextType, type Theme } from '@/contexts/AppContext';

interface AppProviderProps {
  children: ReactNode;
  storageKey: string;
  defaultConfig: AppConfig;
}

export function AppProvider({ children, storageKey, defaultConfig }: AppProviderProps) {
  const [rawConfig, setConfig] = useLocalStorage<Partial<AppConfig>>(storageKey, {});

  const updateConfig = (updater: (current: Partial<AppConfig>) => Partial<AppConfig>) => {
    setConfig(updater);
  };

  const config: AppConfig = { ...defaultConfig, ...rawConfig };

  const contextValue: AppContextType = { config, updateConfig };

  useApplyTheme(config.theme);

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
}

function useApplyTheme(theme: Theme) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => {
      const root = document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(mq.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);
}
