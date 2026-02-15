import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DBProduct } from '@/types/database';
import { Skeleton } from '@/components/ui/skeleton';

interface ProductCardProps {
  product: DBProduct;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  const defaultImage = '/placeholder.svg';
  const imageSrc = product.images[0] || defaultImage;

  return (
    <Link
      to={`/product/${product.id}`}
      className="block"
    >
      <div className="relative overflow-hidden bg-secondary">
        <div className="aspect-product relative">
          {!imageLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full" />
          )}
          <img
            src={imageSrc}
            alt={product.name}
            className={`w-full h-full object-cover transition-opacity duration-500 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-1">
            {product.is_new && (
              <span className="bg-background text-foreground text-[10px] tracking-wider uppercase px-2 py-1">
                Nuevo
              </span>
            )}
            {(!product.is_in_stock || product.stock === 0) && (
              <span className="bg-destructive text-destructive-foreground text-[10px] tracking-wider uppercase px-2 py-1">
                Agotado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="mt-3 space-y-1">
        {product.sku && (
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
            {product.sku}
          </p>
        )}
        <h3 className="text-sm font-normal text-foreground leading-tight line-clamp-2">
          {product.name}
        </h3>
        <p className="text-sm text-foreground">
          ${product.price.toFixed(2)}
        </p>
      </div>
    </Link>
  );
};

export const ProductCardSkeleton = () => (
  <div className="block">
    <div className="bg-secondary aspect-product">
      <Skeleton className="w-full h-full" />
    </div>
    <div className="mt-3 space-y-2">
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  </div>
);