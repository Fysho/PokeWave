import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BattleSettings {
  levelMode: 'random' | 'set';
  setLevel: number;
}

interface SettingsState {
  battleSettings: BattleSettings;
  isSettingsPanelExpanded: boolean;
  setBattleSettings: (settings: BattleSettings) => void;
  toggleSettingsPanel: () => void;
  setSettingsPanelExpanded: (expanded: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      battleSettings: {
        levelMode: 'random',
        setLevel: 50,
      },
      isSettingsPanelExpanded: false,
      setBattleSettings: (settings) => set({ battleSettings: settings }),
      toggleSettingsPanel: () => set((state) => ({ isSettingsPanelExpanded: !state.isSettingsPanelExpanded })),
      setSettingsPanelExpanded: (expanded) => set({ isSettingsPanelExpanded: expanded }),
    }),
    {
      name: 'pokewave-settings',
    }
  )
);