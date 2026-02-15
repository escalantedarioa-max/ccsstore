import { useFilterStore } from '@/store/useFilterStore';
import { useCategories } from '@/hooks/useCategories';
import { Skeleton } from '@/components/ui/skeleton';

export const CategoryHeader = () => {
  const { selectedCategory, setCategory } = useFilterStore();
  const { data: categories, isLoading } = useCategories();

  if (isLoading) {
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

  const visibleCategories = (categories ?? []).filter((c) => c.is_visible);

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
        {visibleCategories.map((category) => (
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
