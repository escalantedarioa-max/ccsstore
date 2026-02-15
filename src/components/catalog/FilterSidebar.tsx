import { useMemo } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useFilterStore } from '@/store/useFilterStore';
import { useProducts } from '@/hooks/useProducts';

const PRICE_RANGES = [
  { id: 'under-50', label: 'Hasta $50', min: 0, max: 50 },
  { id: '50-100', label: '$50 - $100', min: 50, max: 100 },
  { id: '100-200', label: '$100 - $200', min: 100, max: 200 },
  { id: 'over-200', label: 'Más de $200', min: 200, max: Infinity },
] as const;

interface FilterSidebarProps {
  open: boolean;
  onClose: () => void;
}

export const FilterSidebar = ({ open, onClose }: FilterSidebarProps) => {
  const {
    selectedSizes,
    selectedColors,
    selectedPriceRange,
    toggleSize,
    toggleColor,
    setPriceRange,
    clearFilters,
  } = useFilterStore();

  const { data: products = [] } = useProducts();

  const filters = useMemo(() => {
    const visible = products.filter((p) => p.is_visible);
    const sizes = Array.from(
      new Set(visible.flatMap((p) => p.sizes ?? []).filter(Boolean))
    ).sort();
    const colors = Array.from(
      new Set(visible.flatMap((p) => p.colors ?? []).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b));
    return { sizes, colors };
  }, [products]);

  const hasActiveFilters =
    selectedSizes.length > 0 || selectedColors.length > 0 || selectedPriceRange;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full max-w-sm p-0 overflow-y-auto">
        <SheetHeader className="sticky top-0 bg-background z-10 px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-sm font-normal tracking-wider uppercase">
              Filtrar
            </SheetTitle>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs underline text-muted-foreground hover:text-foreground transition-colors"
              >
                Limpiar todo
              </button>
            )}
          </div>
        </SheetHeader>

        <div className="p-6 space-y-8">
          {/* Sizes */}
          <div>
            <h3 className="text-xs font-normal tracking-wider uppercase mb-4">Talla</h3>
            <div className="flex flex-wrap gap-2">
              {filters.sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => toggleSize(size)}
                  className={`min-w-[40px] h-10 px-3 text-sm border transition-colors ${
                    selectedSizes.includes(size)
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-foreground border-border hover:border-foreground'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Colors */}
          <div>
            <h3 className="text-xs font-normal tracking-wider uppercase mb-4">Color</h3>
            <div className="flex flex-wrap gap-2">
              {filters.colors.map((color) => (
                <button
                  key={color}
                  onClick={() => toggleColor(color)}
                  className={`h-10 px-4 text-sm border transition-colors ${
                    selectedColors.includes(color)
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-foreground border-border hover:border-foreground'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div>
            <h3 className="text-xs font-normal tracking-wider uppercase mb-4">Precio</h3>
            <div className="space-y-2">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.id}
                  onClick={() =>
                    setPriceRange(selectedPriceRange === range.id ? null : range.id)
                  }
                  className={`w-full text-left py-3 px-4 text-sm border transition-colors ${
                    selectedPriceRange === range.id
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-background text-foreground border-border hover:border-foreground'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Apply Button */}
        <div className="sticky bottom-0 bg-background border-t border-border p-6">
          <button
            onClick={onClose}
            className="w-full h-12 bg-foreground text-background text-sm tracking-wider uppercase transition-opacity hover:opacity-80"
          >
            Ver Resultados
          </button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
