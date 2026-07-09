import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export const useThemeStore = create(
  persist(
    (set, get) => ({
      theme: 'dark', // default is dark based on current app style
      
      setTheme: (newTheme) => set({ theme: newTheme }),
      
      // helper to get the active color scheme
      getActiveTheme: () => {
        const { theme } = get();
        if (theme === 'system') {
          return Appearance.getColorScheme() || 'dark';
        }
        return theme;
      },
    }),
    {
      name: 'theme-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
