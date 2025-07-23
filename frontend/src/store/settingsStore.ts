import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface BattleSettings {
  levelMode: 'random' | 'set';
  setLevel: number;
  generation: number;
  withItems: boolean;
  movesetType?: 'random' | 'competitive';
  aiDifficulty?: 'random' | 'elite';
  debugMode?: boolean;
}

interface SettingsState {
  battleSettings: BattleSettings;
  isSettingsPanelExpanded: boolean;
  isSimulationPanelExpanded: boolean;
  isBattleTesterExpanded: boolean;
  battleSimulation: any;
  battleTesterSimulation: any;
  isSimulating: boolean;
  isBattleTesterSimulating: boolean;
  setBattleSettings: (settings: BattleSettings) => void;
  toggleSettingsPanel: () => void;
  setSettingsPanelExpanded: (expanded: boolean) => void;
  toggleSimulationPanel: () => void;
  setSimulationPanelExpanded: (expanded: boolean) => void;
  toggleBattleTester: () => void;
  setBattleTesterExpanded: (expanded: boolean) => void;
  setBattleSimulation: (simulation: any) => void;
  setBattleTesterSimulation: (simulation: any) => void;
  setIsSimulating: (isSimulating: boolean) => void;
  setIsBattleTesterSimulating: (isSimulating: boolean) => void;
  clearBattleSimulation: () => void;
  clearBattleTesterSimulation: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      battleSettings: {
        levelMode: 'random',
        setLevel: 50,
        generation: 1,
        withItems: false,
        movesetType: 'random',
        aiDifficulty: 'random',
      },
      isSettingsPanelExpanded: false,
      isSimulationPanelExpanded: false,
      isBattleTesterExpanded: false,
      battleSimulation: null,
      battleTesterSimulation: null,
      isSimulating: false,
      isBattleTesterSimulating: false,
      setBattleSettings: (settings) => set({ battleSettings: settings }),
      toggleSettingsPanel: () => set((state) => ({ isSettingsPanelExpanded: !state.isSettingsPanelExpanded })),
      setSettingsPanelExpanded: (expanded) => set({ isSettingsPanelExpanded: expanded }),
      toggleSimulationPanel: () => set((state) => ({ isSimulationPanelExpanded: !state.isSimulationPanelExpanded })),
      setSimulationPanelExpanded: (expanded) => set({ isSimulationPanelExpanded: expanded }),
      toggleBattleTester: () => set((state) => ({ isBattleTesterExpanded: !state.isBattleTesterExpanded })),
      setBattleTesterExpanded: (expanded) => set({ isBattleTesterExpanded: expanded }),
      setBattleSimulation: (simulation) => set({ battleSimulation: simulation }),
      setBattleTesterSimulation: (simulation) => set({ battleTesterSimulation: simulation }),
      setIsSimulating: (isSimulating) => set({ isSimulating: isSimulating }),
      setIsBattleTesterSimulating: (isSimulating) => set({ isBattleTesterSimulating: isSimulating }),
      clearBattleSimulation: () => set({ battleSimulation: null, isSimulating: false }),
      clearBattleTesterSimulation: () => set({ battleTesterSimulation: null, isBattleTesterSimulating: false }),
    }),
    {
      name: 'pokewave-settings',
      partialize: (state) => ({
        battleSettings: state.battleSettings,
        isSettingsPanelExpanded: state.isSettingsPanelExpanded,
        isSimulationPanelExpanded: state.isSimulationPanelExpanded,
        isBattleTesterExpanded: state.isBattleTesterExpanded,
      }),
      // Handle migration for existing users without new fields
      onRehydrateStorage: () => (state) => {
        if (state && state.battleSettings) {
          if (!state.battleSettings.generation) {
            state.battleSettings.generation = 1;
          }
          if (state.battleSettings.withItems === undefined) {
            state.battleSettings.withItems = false;
          }
          if (state.battleSettings.movesetType === undefined) {
            state.battleSettings.movesetType = 'random';
          }
          if (state.battleSettings.aiDifficulty === undefined) {
            state.battleSettings.aiDifficulty = 'random';
          }
        }
      },
    }
  )
);