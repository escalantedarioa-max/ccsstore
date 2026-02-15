import { useMemo, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { useStoreSettings } from '@/hooks/useStoreSettings';
import { useDocumentHead } from '@/hooks/useDocumentHead';
import { Footer } from '@/components/layout/Footer';
import { ProductCard, ProductCardSkeleton } from '@/components/catalog/ProductCard';
import { FilterSidebar } from '@/components/catalog/FilterSidebar';
import { SortDropdown } from '@/components/catalog/SortDropdown';
import { CategoryHeader } from '@/components/catalog/CategoryHeader';
import { SearchBar } from '@/components/catalog/SearchBar';
import { useFilterStore } from '@/store/useFilterStore';
import { useProducts } from '@/hooks/useProducts';
import { DBProduct } from '@/types/database';

const Index = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: products, isLoading } = useProducts();
  const { data: storeSettings } = useStoreSettings();

  useDocumentHead(
    storeSettings?.shop_name ? `${storeSettings.shop_name} – Catálogo` : 'Catálogo',
    storeSettings?.shop_name ? { description: `Catálogo de ${storeSettings.shop_name}. Explora y compra por WhatsApp.` } : undefined
  );

  const {
    selectedCategory,
    selectedSizes,
    selectedColors,
    selectedPriceRange,
    sortBy,
  } = useFilterStore();

  const filteredProducts = useMemo(() => {
    let result = (products || []).filter(p => p.is_visible) as DBProduct[];

    // Search filter (case-insensitive by name or SKU)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(query) ||
        (p.sku && p.sku.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter((p) => p.category === selectedCategory);
    }

    // Filter by sizes
    if (selectedSizes.length > 0) {
      result = result.filter((p) =>
        p.sizes.some((size) => selectedSizes.includes(size))
      );
    }

    // Filter by colors
    if (selectedColors.length > 0) {
      result = result.filter((p) =>
        p.colors.some((color) =>
          selectedColors.some((selected) =>
            color.toLowerCase().includes(selected.toLowerCase())
          )
        )
      );
    }

    // Filter by price range
    if (selectedPriceRange) {
      const priceRanges: Record<string, { min: number; max: number }> = {
        'under-50': { min: 0, max: 50 },
        '50-100': { min: 50, max: 100 },
        '100-200': { min: 100, max: 200 },
        'over-200': { min: 200, max: Infinity },
      };
      const range = priceRanges[selectedPriceRange];
      if (range) {
        result = result.filter((p) => p.price >= range.min && p.price <= range.max);
      }
    }

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result = [...result].sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result = [...result].sort((a, b) => b.price - a.price);
        break;
      case 'newest':
      default:
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, selectedSizes, selectedColors, selectedPriceRange, sortBy, products]);

  const activeFilterCount =
    selectedSizes.length + selectedColors.length + (selectedPriceRange ? 1 : 0);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <CategoryHeader />

      {/* Search Bar - Sticky on mobile */}
      <div className="sticky top-14 md:top-16 z-50 bg-background border-b border-border px-4 md:px-8 py-3">
        <SearchBar 
          value={searchQuery} 
          onChange={setSearchQuery}
          placeholder="Buscar por nombre o SKU..."
        />
      </div>

      {/* Filter Bar */}
      <div className="sticky top-[106px] md:top-[112px] z-40 bg-background border-b border-border">
        <div className="flex items-center justify-between px-4 md:px-8 py-3">
          <button
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 text-sm text-foreground hover:text-muted-foreground transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtrar</span>
            {activeFilterCount > 0 && (
              <span className="bg-foreground text-background text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden md:inline">
              {filteredProducts.length} productos
            </span>
            <SortDropdown />
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <main className="flex-1 px-2 md:px-8 py-4 md:py-8">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-1 md:gap-4">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-lg text-foreground mb-2">
              No encontramos artículos con ese código o nombre
            </p>
            <p className="text-sm text-muted-foreground">
              Intenta con otro término de búsqueda o ajusta los filtros
            </p>
          </div>
        )}
      </main>

      <Footer />
      <FilterSidebar open={filterOpen} onClose={() => setFilterOpen(false)} />
    </div>
  );
};

export default Index;