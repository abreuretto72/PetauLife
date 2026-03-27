import { create } from 'zustand';
import type { Pet } from '../types/database';
import { supabase } from '../lib/supabase';

interface PetState {
  pets: Pet[];
  selectedPetId: string | null;
  isLoading: boolean;
  fetchPets: () => Promise<void>;
  addPet: (pet: Omit<Pet, 'id' | 'created_at' | 'updated_at' | 'is_active'>) => Promise<void>;
  updatePet: (id: string, updates: Partial<Pet>) => Promise<void>;
  selectPet: (id: string | null) => void;
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  selectedPetId: null,
  isLoading: false,

  fetchPets: async () => {
    set({ isLoading: true });
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      set({ isLoading: false });
      throw error;
    }
    set({ pets: (data as Pet[]) ?? [], isLoading: false });
  },

  addPet: async (pet) => {
    const { data, error } = await supabase
      .from('pets')
      .insert(pet)
      .select()
      .single();

    if (error) throw error;
    set({ pets: [data as Pet, ...get().pets] });
  },

  updatePet: async (id, updates) => {
    const { error } = await supabase
      .from('pets')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
    set({
      pets: get().pets.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    });
  },

  selectPet: (id) => set({ selectedPetId: id }),
}));
