import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BattleSettings {
  levelMode: 'random' | 'set';
  setLevel: number;
  generation: number;
  withItems: boolean;
}

interface SettingsState {
  battleSettings: BattleSettings;
  isSettingsPanelExpanded: boolean;
  isSimulationPanelExpanded: boolean;
  battleSimulation: any;
  isSimulating: boolean;
  setBattleSettings: (settings: BattleSettings) => void;
  toggleSettingsPanel: () => void;
  setSettingsPanelExpanded: (expanded: boolean) => void;
  toggleSimulationPanel: () => void;
  setSimulationPanelExpanded: (expanded: boolean) => void;
  setBattleSimulation: (simulation: any) => void;
  setIsSimulating: (isSimulating: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      battleSettings: {
        levelMode: 'random',
        setLevel: 50,
        generation: 1,
        withItems: false,
      },
      isSettingsPanelExpanded: false,
      isSimulationPanelExpanded: false,
      battleSimulation: null,
      isSimulating: false,
      setBattleSettings: (settings) => set({ battleSettings: settings }),
      toggleSettingsPanel: () => set((state) => ({ isSettingsPanelExpanded: !state.isSettingsPanelExpanded })),
      setSettingsPanelExpanded: (expanded) => set({ isSettingsPanelExpanded: expanded }),
      toggleSimulationPanel: () => set((state) => ({ isSimulationPanelExpanded: !state.isSimulationPanelExpanded })),
      setSimulationPanelExpanded: (expanded) => set({ isSimulationPanelExpanded: expanded }),
      setBattleSimulation: (simulation) => set({ battleSimulation: simulation }),
      setIsSimulating: (isSimulating) => set({ isSimulating: isSimulating }),
    }),
    {
      name: 'pokewave-settings',
      partialize: (state) => ({
        battleSettings: state.battleSettings,
        isSettingsPanelExpanded: state.isSettingsPanelExpanded,
        isSimulationPanelExpanded: state.isSimulationPanelExpanded,
      }),
      // Handle migration for existing users without generation or withItems field
      onRehydrateStorage: () => (state) => {
        if (state && state.battleSettings) {
          if (!state.battleSettings.generation) {
            state.battleSettings.generation = 1;
          }
          if (state.battleSettings.withItems === undefined) {
            state.battleSettings.withItems = false;
          }
        }
      },
    }
  )
);