import { useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useProducts';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package, AlertTriangle, Plus, LogOut, CheckCircle, XCircle, Settings, Tags } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function AdminDashboard() {
  const { data: products, isLoading } = useProducts();
  const { signOut, user } = useAuth();
  const navigate = useNavigate();

  const totalProducts = products?.length || 0;
  const outOfStock = products?.filter((p) => !p.is_in_stock).length || 0;
  const hiddenProducts = products?.filter((p) => !p.is_visible).length || 0;

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <h1 className="text-lg font-semibold tracking-tight">Panel Admin</h1>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-24">
        {/* Connection Status */}
        {!isLoading && (
          <Alert variant={products ? 'default' : 'destructive'} className="py-2">
            {products ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription className="ml-2">
              {products 
                ? 'Conexión con Supabase: Activa' 
                : 'Error de Conexión con Supabase'}
            </AlertDescription>
          </Alert>
        )}

        {/* Welcome */}
        <p className="text-sm text-muted-foreground">
          Hola, {user?.email?.split('@')[0]}
        </p>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Package className="h-4 w-4" />
                    <span className="text-xs">Total Productos</span>
                  </div>
                  <p className="text-3xl font-semibold">{totalProducts}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-xs">Agotados</span>
                  </div>
                  <p className="text-3xl font-semibold text-destructive">
                    {outOfStock}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Info */}
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{hiddenProducts}</span> productos ocultos
            </p>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="space-y-3">
          <Button
            size="lg"
            className="w-full h-16 text-lg gap-3"
            onClick={() => navigate('/admin/products/new')}
          >
            <Plus className="h-6 w-6" />
            Añadir Producto
          </Button>

          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => navigate('/admin/products')}
          >
            <Package className="mr-2 h-5 w-5" />
            Ver Inventario
          </Button>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <Button
              variant="outline"
              className="h-12"
              onClick={() => navigate('/admin/categories')}
            >
              <Tags className="mr-2 h-4 w-4" />
              Categorías
            </Button>

            <Button
              variant="outline"
              className="h-12"
              onClick={() => navigate('/admin/settings')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Configuración
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
