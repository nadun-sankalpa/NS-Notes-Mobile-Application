import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type FontOption = 'System' | 'SpaceMono';

interface Settings {
  defaultFontSize: number;
  defaultFont: FontOption;
  confirmDelete: boolean;
  defaultFontScale: number;
  confirmDeleteModal: boolean;
}

interface SettingsContextType {
  settings: Settings;
  setSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  loading: boolean;
}

const SettingsContext = createContext<SettingsContextType>({} as SettingsContextType);

export const useSettings = () => useContext(SettingsContext);

const defaultSettings: Settings = {
  defaultFontSize: 16,
  defaultFont: 'System',
  confirmDelete: true,
  defaultFontScale: 1,
  confirmDeleteModal: false,
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem('appSettings');
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        }
      } catch (e) {
        console.error('Failed to load settings.', e);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const setSetting = async <K extends keyof Settings>(key: K, value: Settings[K]) => {
    try {
      const newSettings = { ...settings, [key]: value };
      setSettings(newSettings);
      await AsyncStorage.setItem('appSettings', JSON.stringify(newSettings));
    } catch (e) {
      console.error('Failed to save setting.', e);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, setSetting, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
