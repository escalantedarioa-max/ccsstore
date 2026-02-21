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

type SizeGroup = { raw: string; display: string };
type SizeGroups = {
  ropa: SizeGroup[];
  mujer: SizeGroup[];
  hombre: SizeGroup[];
};

function groupSizes(rawSizes: string[]): SizeGroups {
  const ropa: SizeGroup[] = [];
  const mujer: SizeGroup[] = [];
  const hombre: SizeGroup[] = [];
  const seen = new Set<string>();

  for (const raw of rawSizes) {
    if (!raw || seen.has(raw)) continue;
    seen.add(raw);

    if (raw.startsWith('mujer-')) {
      const display = raw.replace(/^mujer-/, '');
      mujer.push({ raw, display });
    } else if (raw.startsWith('hombre-')) {
      const display = raw.replace(/^hombre-/, '');
      hombre.push({ raw, display });
    } else {
      ropa.push({ raw, display: raw });
    }
  }

  const sortNumeric = (a: SizeGroup, b: SizeGroup) => {
    const na = parseFloat(a.display);
    const nb = parseFloat(b.display);
    if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
    return a.display.localeCompare(b.display);
  };

  return {
    ropa: ropa.sort((a, b) => a.display.localeCompare(b.display)),
    mujer: mujer.sort(sortNumeric),
    hombre: hombre.sort(sortNumeric),
  };
}

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
    const sizeValues = Array.from(
      new Set(visible.flatMap((p) => p.sizes ?? []).filter(Boolean))
    );
    const colors = Array.from(
      new Set(visible.flatMap((p) => p.colors ?? []).filter(Boolean))
    ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    const sizeGroups = groupSizes(sizeValues);
    return { sizeGroups, colors };
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
          {/* Tallas: ropa (XS–XXL), mujer (zapatos/pantalones), hombre (zapatos/pantalones) */}
          {(filters.sizeGroups.ropa.length > 0 ||
            filters.sizeGroups.mujer.length > 0 ||
            filters.sizeGroups.hombre.length > 0) && (
            <div className="space-y-5 border-b border-border pb-6">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-foreground mb-4">
                Talla
              </h3>

              {filters.sizeGroups.ropa.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground uppercase tracking-wide">
                    Ropa (XS–XXL)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filters.sizeGroups.ropa.map(({ raw, display }) => (
                      <button
                        key={raw}
                        onClick={() => toggleSize(raw)}
                        className={`min-w-[40px] h-10 px-3 text-sm border transition-colors ${
                          selectedSizes.includes(raw)
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-background text-foreground border-border hover:border-foreground'
                        }`}
                      >
                        {display}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filters.sizeGroups.mujer.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground uppercase tracking-wide">
                    Mujer (calzado / cintura)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filters.sizeGroups.mujer.map(({ raw, display }) => (
                      <button
                        key={raw}
                        onClick={() => toggleSize(raw)}
                        className={`min-w-[40px] h-10 px-3 text-sm border transition-colors ${
                          selectedSizes.includes(raw)
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-background text-foreground border-border hover:border-foreground'
                        }`}
                      >
                        {display}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filters.sizeGroups.hombre.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-foreground uppercase tracking-wide">
                    Hombre (calzado / cintura)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {filters.sizeGroups.hombre.map(({ raw, display }) => (
                      <button
                        key={raw}
                        onClick={() => toggleSize(raw)}
                        className={`min-w-[40px] h-10 px-3 text-sm border transition-colors ${
                          selectedSizes.includes(raw)
                            ? 'bg-foreground text-background border-foreground'
                            : 'bg-background text-foreground border-border hover:border-foreground'
                        }`}
                      >
                        {display}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Colores: todos los que existan en productos (incl. personalizados) */}
          {filters.colors.length > 0 && (
            <div className="border-b border-border pb-6">
              <h3 className="text-xs font-semibold tracking-wider uppercase text-foreground mb-4">
                Color
              </h3>
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
          )}

          {/* Precio */}
          <div>
            <h3 className="text-xs font-semibold tracking-wider uppercase text-foreground mb-4">
              Precio
            </h3>
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
