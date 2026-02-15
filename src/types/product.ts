export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  materials: string;
  category: string;
  colors: string[];
  sizes: string[];
  badge: string | null;
  images: string[];
}

export interface Category {
  id: string;
  name: string;
}

export interface PriceRange {
  id: string;
  label: string;
  min: number;
  max: number;
}

export interface Filters {
  sizes: string[];
  colors: string[];
  priceRanges: PriceRange[];
}

export interface CartItem {
  product: Product;
  selectedSize: string;
  selectedColor: string;
  quantity: number;
}

export interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: string, color: string) => void;
  updateQuantity: (productId: string, size: string, color: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

export interface FilterState {
  selectedCategory: string;
  selectedSizes: string[];
  selectedColors: string[];
  selectedPriceRange: string | null;
  sortBy: 'newest' | 'price-asc' | 'price-desc';
  setCategory: (category: string) => void;
  toggleSize: (size: string) => void;
  toggleColor: (color: string) => void;
  setPriceRange: (range: string | null) => void;
  setSortBy: (sort: 'newest' | 'price-asc' | 'price-desc') => void;
  clearFilters: () => void;
}
