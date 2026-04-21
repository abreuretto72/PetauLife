/**
 * usePetSearch — Busca progressiva de pets por nome, raça e espécie.
 *
 * Normaliza strings (sem acento, lowercase) para que "joao" encontre "João".
 * Debounce de 200ms para evitar re-renders excessivos.
 */

import { useState, useEffect, useMemo } from 'react';
import type { Pet } from '../types/database';

function normalize(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

interface UsePetSearchResult {
  query: string;
  setQuery: (q: string) => void;
  debouncedQuery: string;
  filtered: Pet[];
  recent: Pet[];
  isSearching: boolean;
}

export function usePetSearch(pets: Pet[]): UsePetSearchResult {
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  const filtered = useMemo(() => {
    if (!debouncedQuery) return pets;
    const q = normalize(debouncedQuery);
    return pets.filter((p) => {
      const name = normalize(p.name);
      const breed = normalize(p.breed ?? '');
      const species = normalize(p.species);
      return name.includes(q) || breed.includes(q) || species.includes(q);
    });
  }, [pets, debouncedQuery]);

  // Top 5 por last_accessed_at DESC, com fallback para updated_at
  const recent = useMemo(() => {
    return [...pets]
      .sort((a, b) => {
        const dateA = new Date((a.last_accessed_at ?? a.updated_at) || 0).getTime();
        const dateB = new Date((b.last_accessed_at ?? b.updated_at) || 0).getTime();
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [pets]);

  const isSearching = debouncedQuery.length > 0;

  console.log('[usePetSearch] query:', normalize(debouncedQuery) || '(vazio)', '| results:', filtered.length);

  return { query, setQuery, debouncedQuery, filtered, recent, isSearching };
}
