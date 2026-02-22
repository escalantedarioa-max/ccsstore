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
      className="block group"
    >
      {/* Card: usa variables del Design System (--color-background-card, --border-radius-card, --shadow-card) */}
      <div className="relative overflow-hidden bg-card-surface rounded-card p-2 shadow-card transition-shadow duration-300 group-hover:shadow-card-hover border border-card-border">
        <div
          className="aspect-product relative overflow-hidden bg-muted/50"
          style={{ borderRadius: 'calc(var(--border-radius-card) - 4px)' }}
        >
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

          {/* Badges: "Nuevo" con acento del tema y animación pulso/brillo */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.is_new && (
              <span className="badge-new text-[10px] font-semibold tracking-wider uppercase px-2.5 py-1 rounded-md">
                Nuevo
              </span>
            )}
            {(!product.is_in_stock || product.stock === 0) && (
              <span className="bg-destructive text-destructive-foreground text-[10px] tracking-wider uppercase px-2 py-1 rounded-md">
                Agotado
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="mt-2 space-y-0.5">
        <p className="text-sm font-bold text-foreground">
          ${product.price.toFixed(2)}
        </p>
        <p className="text-xs text-muted-foreground">
          {product.stock === 0
            ? 'Sin stock'
            : `${product.stock} ${product.stock === 1 ? 'unidad' : 'unidades'} disponible${product.stock === 1 ? '' : 's'}`
          }
        </p>
        <h3 className="text-sm font-normal text-foreground leading-tight line-clamp-2 uppercase">
          {product.name}
        </h3>
      </div>
    </Link>
  );
};

export const ProductCardSkeleton = () => (
  <div className="block">
    <div className="bg-card-surface rounded-card shadow-card aspect-product overflow-hidden">
      <Skeleton className="w-full h-full" />
    </div>
    <div className="mt-3 space-y-2">
      <Skeleton className="h-3 w-1/4" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  </div>
);