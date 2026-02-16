import { useNavigate } from 'react-router-dom';
import { useAnalyticsStats } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Eye, ShoppingCart, TrendingUp } from 'lucide-react';

export default function AdminStats() {
  const navigate = useNavigate();
  const { data: stats, isLoading, error } = useAnalyticsStats();

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold tracking-tight">Estadísticas</h1>
          </div>
        </div>
      </header>

      <main className="p-4 space-y-4 pb-24">
        <p className="text-sm text-muted-foreground">
          Últimos 30 días. Visitas = vistas de ficha de producto; Clics = clics en &quot;Agregar al carrito&quot;.
        </p>

        {error && (
          <p className="text-sm text-destructive">
            No se pudieron cargar las estadísticas. Comprueba que la tabla analytics_events exista y RLS permita lectura.
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Eye className="h-4 w-4" />
                    <span className="text-xs">Visitas (vistas producto)</span>
                  </div>
                  <p className="text-3xl font-semibold">{stats?.totalProductViews ?? 0}</p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              {isLoading ? (
                <Skeleton className="h-14 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <ShoppingCart className="h-4 w-4" />
                    <span className="text-xs">Clics en comprar</span>
                  </div>
                  <p className="text-3xl font-semibold">{stats?.totalAddToCartClicks ?? 0}</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Artículos más vistos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !stats?.topViewedProducts?.length ? (
              <p className="text-sm text-muted-foreground">Aún no hay datos de visitas.</p>
            ) : (
              <ul className="space-y-2">
                {stats.topViewedProducts.map((item, index) => (
                  <li
                    key={item.productId}
                    className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                  >
                    <span className="text-muted-foreground w-6">{index + 1}.</span>
                    <span className="flex-1 truncate font-medium">{item.name}</span>
                    {item.sku && (
                      <span className="text-muted-foreground text-xs shrink-0 ml-2">REF: {item.sku}</span>
                    )}
                    <span className="text-muted-foreground shrink-0 ml-2">{item.viewCount} vistas</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
