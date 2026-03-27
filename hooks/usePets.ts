import { useQuery } from '@tanstack/react-query';
import { usePetStore } from '../stores/petStore';
import { useAuthStore } from '../stores/authStore';

export function usePets() {
  const { pets, selectedPetId, addPet, updatePet, selectPet, fetchPets } = usePetStore();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const query = useQuery({
    queryKey: ['pets'],
    queryFn: async () => {
      await fetchPets();
      return usePetStore.getState().pets;
    },
    enabled: isAuthenticated,
  });

  const selectedPet = pets.find((p) => p.id === selectedPetId) ?? null;

  return {
    pets,
    selectedPet,
    selectedPetId,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    addPet,
    updatePet,
    selectPet,
  };
}
