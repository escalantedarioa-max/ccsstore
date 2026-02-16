import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useProducts, useUpdateProduct, useDuplicateProduct, useDeleteProduct } from '@/hooks/useProducts';
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
import { ArrowLeft, Search, MoreVertical, Copy, Pencil, Trash2 } from 'lucide-react';

export default function ProductList() {
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { data: products, isLoading } = useProducts();
  const updateProduct = useUpdateProduct();
  const duplicateProduct = useDuplicateProduct();
  const deleteProduct = useDeleteProduct();
  const navigate = useNavigate();

  const filteredProducts = products?.filter((p) => {
    const searchLower = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) ||
      (p.sku && p.sku.toLowerCase().includes(searchLower))
    );
  });

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
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Inventario</h1>
        </div>

        {/* Search */}
        <div className="px-4 pb-4">
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
      </header>

      <main className="p-4 space-y-3 pb-24">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : filteredProducts?.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p>No se encontraron productos</p>
          </div>
        ) : (
          filteredProducts?.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-3 p-3">
                  {/* Image */}
                  <div className="w-16 h-20 bg-muted rounded overflow-hidden flex-shrink-0">
                    {product.images[0] ? (
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

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    {product.sku && (
                      <p className="text-xs text-primary font-mono mb-0.5">{product.sku}</p>
                    )}
                    <h3 className="font-medium text-sm truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">${product.price}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {product.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Stock: <span className="font-medium text-foreground">{product.stock}</span> {product.stock === 1 ? 'unidad' : 'unidades'}
                    </p>
                  </div>

                  {/* Actions */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="flex-shrink-0">
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

                {/* Toggles */}
                <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={product.is_visible}
                      onCheckedChange={() => handleToggleVisible(product)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {product.is_visible ? 'Visible' : 'Oculto'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Switch
                      checked={product.is_in_stock}
                      onCheckedChange={() => handleToggleStock(product)}
                    />
                    <span className="text-xs text-muted-foreground">
                      {product.is_in_stock ? 'En Stock' : 'Agotado'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </main>

      {/* Delete Dialog */}
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
