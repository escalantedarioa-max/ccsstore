import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/useCartStore';
import { useSearchBarStore } from '@/store/useSearchBarStore';
import { useStoreSettings } from '@/hooks/useStoreSettings';

export const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const totalItems = useCartStore((state) => state.getTotalItems());
  const openSearch = useSearchBarStore((s) => s.open);
  const { data: storeSettings } = useStoreSettings();

  const handleSearchClick = () => {
    if (location.pathname !== '/') navigate('/');
    openSearch();
  };

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 md:h-16 px-4 md:px-8">
        <Link to="/" className="flex items-center">
          {storeSettings?.shop_logo_url ? (
            <img
              src={storeSettings.shop_logo_url}
              alt={storeSettings?.shop_name || 'Logo'}
              className="h-8 md:h-10 object-contain"
            />
          ) : (
            <span className="text-lg md:text-xl tracking-widest font-medium">
              {storeSettings?.shop_name || 'TIENDA'}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3 md:gap-4">
          <button type="button" onClick={handleSearchClick} className="p-1" aria-label="Buscar">
            <Search className="w-5 h-5" />
          </button>
          <Link to="/cart" className="p-1 relative" aria-label="Carrito">
            <ShoppingBag className="w-5 h-5" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-foreground text-background text-[10px] w-4 h-4 flex items-center justify-center">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};
