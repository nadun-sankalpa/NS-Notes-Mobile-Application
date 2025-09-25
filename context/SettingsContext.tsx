import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';

type Settings = {
  defaultFontSize: number;
  defaultFont: 'System' | 'SpaceMono';
  confirmDelete: boolean;
};

type SettingsContextType = {
  settings: Settings;
  updateSettings: (partial: Partial<Settings>) => void;
};

const defaultSettings: Settings = {
  defaultFontSize: 16,
  defaultFont: 'System',
  confirmDelete: true,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const value = useMemo(() => ({
    settings,
    updateSettings: (partial: Partial<Settings>) => setSettings(prev => ({ ...prev, ...partial })),
  }), [settings]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
};

export const useSettings = (): SettingsContextType => {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    // Safe defaults even if provider is missing
    return {
      settings: defaultSettings,
      updateSettings: () => {},
    };
  }
  return ctx;
};
