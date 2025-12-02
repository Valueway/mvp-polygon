import { create } from 'zustand';
import type { Farm, FarmDetailData, FarmMRVData } from '@/types';

interface FarmState {
  farms: Farm[];
  selectedFarmId: string | null;
  farmData: Map<string, FarmDetailData>;
  isLoading: boolean;
  error: string | null;
  
  setFarms: (farms: Farm[]) => void;
  addFarm: (farm: Farm) => void;
  updateFarm: (id: string, updates: Partial<Farm>) => void;
  deleteFarm: (id: string) => void;
  selectFarm: (id: string | null) => void;
  setFarmData: (id: string, data: FarmDetailData) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  getSelectedFarm: () => Farm | undefined;
  getSelectedFarmData: () => FarmDetailData | undefined;
  getAllMRVSummaries: () => FarmMRVData[];
}

export const useFarmStore = create<FarmState>((set, get) => ({
  farms: [],
  selectedFarmId: null,
  farmData: new Map(),
  isLoading: false,
  error: null,
  
  setFarms: (farms) => set({ farms }),
  
  addFarm: (farm) => set((state) => ({ 
    farms: [...state.farms, farm] 
  })),
  
  updateFarm: (id, updates) => set((state) => ({
    farms: state.farms.map((farm) => 
      farm.id === id ? { ...farm, ...updates, updated_at: new Date().toISOString() } : farm
    ),
  })),
  
  deleteFarm: (id) => set((state) => ({
    farms: state.farms.filter((farm) => farm.id !== id),
    selectedFarmId: state.selectedFarmId === id ? null : state.selectedFarmId,
  })),
  
  selectFarm: (id) => set({ selectedFarmId: id }),
  
  setFarmData: (id, data) => set((state) => {
    const newFarmData = new Map(state.farmData);
    newFarmData.set(id, data);
    return { farmData: newFarmData };
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  getSelectedFarm: () => {
    const state = get();
    return state.farms.find((farm) => farm.id === state.selectedFarmId);
  },
  
  getSelectedFarmData: () => {
    const state = get();
    if (!state.selectedFarmId) return undefined;
    return state.farmData.get(state.selectedFarmId);
  },
  
  getAllMRVSummaries: () => {
    const state = get();
    const summaries: FarmMRVData[] = [];
    state.farmData.forEach((data) => {
      summaries.push(data.mrv_summary);
    });
    return summaries;
  },
}));
