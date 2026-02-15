import { create } from 'zustand';
import { FilterState } from '@/types/product';

export const useFilterStore = create<FilterState>((set) => ({
  selectedCategory: 'all',
  selectedSizes: [],
  selectedColors: [],
  selectedPriceRange: null,
  sortBy: 'newest',

  setCategory: (category: string) => set({ selectedCategory: category }),

  toggleSize: (size: string) =>
    set((state) => ({
      selectedSizes: state.selectedSizes.includes(size)
        ? state.selectedSizes.filter((s) => s !== size)
        : [...state.selectedSizes, size],
    })),

  toggleColor: (color: string) =>
    set((state) => ({
      selectedColors: state.selectedColors.includes(color)
        ? state.selectedColors.filter((c) => c !== color)
        : [...state.selectedColors, color],
    })),

  setPriceRange: (range: string | null) => set({ selectedPriceRange: range }),

  setSortBy: (sort: 'newest' | 'price-asc' | 'price-desc') => set({ sortBy: sort }),

  clearFilters: () =>
    set({
      selectedCategory: 'all',
      selectedSizes: [],
      selectedColors: [],
      selectedPriceRange: null,
      sortBy: 'newest',
    }),
}));
