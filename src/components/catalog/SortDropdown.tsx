import { ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useFilterStore } from '@/store/useFilterStore';

const sortOptions = [
  { value: 'newest', label: 'Novedades' },
  { value: 'price-asc', label: 'Precio: Menor a Mayor' },
  { value: 'price-desc', label: 'Precio: Mayor a Menor' },
] as const;

export const SortDropdown = () => {
  const { sortBy, setSortBy } = useFilterStore();

  const currentLabel = sortOptions.find((opt) => opt.value === sortBy)?.label || 'Ordenar';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm text-foreground hover:text-muted-foreground transition-colors">
        <span>{currentLabel}</span>
        <ChevronDown className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        {sortOptions.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setSortBy(option.value)}
            className={`cursor-pointer ${sortBy === option.value ? 'font-medium' : ''}`}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
