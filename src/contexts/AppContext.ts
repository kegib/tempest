import { createContext } from 'react';

export type Theme = 'dark' | 'light' | 'system';

export interface AppConfig {
  theme: Theme;
}

export interface AppContextType {
  config: AppConfig;
  updateConfig: (updater: (current: Partial<AppConfig>) => Partial<AppConfig>) => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);
