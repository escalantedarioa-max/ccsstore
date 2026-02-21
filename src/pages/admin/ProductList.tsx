import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useUpdateProduct, useDuplicateProduct, useDeleteProduct } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { DBProduct } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Search, MoreVertical, Copy, Pencil, Trash2, LayoutGrid } from 'lucide-react';
import { cn } from '@/lib/utils';

const ALL_SECTIONS = 'all';

export default function ProductList() {
  const [search, setSearch] = useState('');
  const [sectionSlug, setSectionSlug] = useState<string>(ALL_SECTIONS);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: products, isLoading } = useProducts();
  const { data: categories } = useCategories();
  const updateProduct = useUpdateProduct();
  const duplicateProduct = useDuplicateProduct();
  const deleteProduct = useDeleteProduct();
  const navigate = useNavigate();

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    let list = products;
    if (sectionSlug !== ALL_SECTIONS) {
      const cat = categories?.find((c) => c.slug === sectionSlug);
      const matchBy = cat ? [cat.slug, cat.name] : [sectionSlug];
      list = list.filter(
        (p) => matchBy.some((v) => v && p.category?.toLowerCase() === v.toLowerCase())
      );
    }
    const searchLower = search.trim().toLowerCase();
    if (searchLower) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(searchLower) ||
          (p.sku && p.sku.toLowerCase().includes(searchLower))
      );
    }
    return list;
  }, [products, sectionSlug, categories, search]);

  const sectionsWithProducts = useMemo(() => {
    if (!products?.length || !categories?.length) return [];
    return categories.filter((cat) =>
      products.some(
        (p) =>
          p.category &&
          (p.category.toLowerCase() === cat.slug.toLowerCase() ||
            p.category.toLowerCase() === cat.name.toLowerCase())
      )
    );
  }, [products, categories]);

  const handleToggleVisible = (product: DBProduct) => {
    updateProduct.mutate({ id: product.id, is_visible: !product.is_visible });
  };

  const handleToggleStock = (product: DBProduct) => {
    updateProduct.mutate({ id: product.id, is_in_stock: !product.is_in_stock });
  };

  const handleDuplicate = (product: DBProduct) => {
    duplicateProduct.mutate(product);
  };

  const handleDelete = () => {
    if (deleteId) {
      deleteProduct.mutate(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Inventario</h1>
        </div>

        {/* Búsqueda */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Menú por sección (categoría) */}
        <div className="px-4 pb-4">
          <p className="text-xs font-medium text-muted-foreground mb-2">Sección</p>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 scrollbar-thin">
            <button
              type="button"
              onClick={() => setSectionSlug(ALL_SECTIONS)}
              className={cn(
                'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                sectionSlug === ALL_SECTIONS
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              Todos
            </button>
            {sectionsWithProducts.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSectionSlug(cat.slug)}
                className={cn(
                  'flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  sectionSlug === cat.slug
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="p-4 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <Skeleton className="h-40 w-full rounded-lg mb-3" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <LayoutGrid className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p>No hay productos en esta sección</p>
            {sectionSlug !== ALL_SECTIONS && (
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setSectionSlug(ALL_SECTIONS)}
              >
                Ver todos
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredProducts.map((product) => (
              <Card key={product.id} className="overflow-hidden flex flex-col">
                <CardContent className="p-0 flex flex-col flex-1">
                  {/* Fila superior: Imagen (grande) | Info | Menú */}
                  <div className="grid grid-cols-[72px_1fr_auto] sm:grid-cols-[88px_1fr_auto] gap-2 p-2 sm:p-3">
                    {/* Imagen más grande */}
                    <div className="row-span-1 flex items-start">
                      <div className="w-full aspect-square max-h-20 sm:max-h-28 bg-muted rounded overflow-hidden flex-shrink-0">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                            Sin imagen
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Nombre, SKU, precio, stock, categoría */}
                    <div className="flex flex-col justify-center gap-0.5 min-w-0">
                      {product.sku && (
                        <p className="text-[10px] text-primary font-mono truncate" title={product.sku}>
                          {product.sku}
                        </p>
                      )}
                      <h3 className="font-medium text-xs sm:text-sm truncate" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="font-semibold text-foreground text-xs sm:text-sm">${product.price}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Stock: <span className="font-medium text-foreground">{product.stock}</span> ud.
                        {product.category && (
                          <> · <span className="capitalize">{product.category}</span></>
                        )}
                      </p>
                    </div>

                    {/* Solo menú */}
                    <div className="flex items-start justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => navigate(`/admin/products/${product.id}`)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDuplicate(product)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(product.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Fila inferior: Visible y Stock compactos */}
                  <div className="flex items-center gap-3 px-2 pb-2 sm:px-3 sm:pb-3 pt-0 border-t border-border/50">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Switch
                        checked={product.is_visible}
                        onCheckedChange={() => handleToggleVisible(product)}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {product.is_visible ? 'Visible' : 'Oculto'}
                      </span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <Switch
                        checked={product.is_in_stock}
                        onCheckedChange={() => handleToggleStock(product)}
                      />
                      <span className="text-[10px] text-muted-foreground">
                        {product.is_in_stock ? 'Stock' : 'Agotado'}
                      </span>
                    </label>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
