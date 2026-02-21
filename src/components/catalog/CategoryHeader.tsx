import { useMemo } from 'react';
import { useFilterStore } from '@/store/useFilterStore';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { Skeleton } from '@/components/ui/skeleton';

export const CategoryHeader = () => {
  const { selectedCategory, setCategory } = useFilterStore();
  const { data: categories, isLoading: loadingCategories } = useCategories();
  const { data: products, isLoading: loadingProducts } = useProducts();

  const sectionsWithProducts = useMemo(() => {
    if (!categories?.length || !products?.length) return [];
    const visible = (categories ?? []).filter((c) => c.is_visible);
    return visible.filter((cat) =>
      products.some(
        (p) =>
          p.is_visible &&
          p.category &&
          (p.category.toLowerCase() === cat.slug.toLowerCase() ||
            p.category.toLowerCase() === cat.name.toLowerCase())
      )
    );
  }, [categories, products]);

  if (loadingCategories || loadingProducts) {
    return (
      <div className="py-4 border-b border-border overflow-x-auto scrollbar-hide">
        <div className="flex gap-6 px-4 md:px-8">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-16" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 border-b border-border overflow-x-auto scrollbar-hide">
      <div className="flex gap-6 px-4 md:px-8 min-w-max">
        <button
          onClick={() => setCategory('all')}
          className={`text-sm whitespace-nowrap transition-colors pb-1 ${
            selectedCategory === 'all'
              ? 'text-foreground border-b border-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Todos
        </button>
        {sectionsWithProducts.map((category) => (
          <button
            key={category.id}
            onClick={() => setCategory(category.slug)}
            className={`text-sm whitespace-nowrap transition-colors pb-1 ${
              selectedCategory === category.slug
                ? 'text-foreground border-b border-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  );
};
