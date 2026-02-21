import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAnalyticsStats, getStatsDateRange, type StatsPeriod } from '@/hooks/useAnalytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ArrowLeft, CalendarIcon, Eye, Package, ShoppingCart, TrendingUp } from 'lucide-react';

const PERIOD_LABELS: Record<StatsPeriod, string> = {
  today: 'Hoy',
  week: 'Semana',
  month: 'Mes',
  year: 'Año',
};

export default function AdminStats() {
  const navigate = useNavigate();
  const [period, setPeriod] = useState<StatsPeriod>('month');
  const { data: stats, isLoading, error } = useAnalyticsStats(period);
  const { fromDate, toDate } = getStatsDateRange(period);

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
        {/* Filtro por periodo: botones + calendario */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border bg-background p-1">
            {(['today', 'week', 'month', 'year'] as const).map((p) => (
              <Button
                key={p}
                variant={period === p ? 'secondary' : 'ghost'}
                size="sm"
                className="rounded-md text-xs sm:text-sm"
                onClick={() => setPeriod(p)}
              >
                {PERIOD_LABELS[p]}
              </Button>
            ))}
          </div>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <CalendarIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Ver período</span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={{ from: fromDate, to: toDate }}
                defaultMonth={fromDate}
                numberOfMonths={1}
                className="rounded-md border-0"
              />
              <p className="px-3 pb-3 text-xs text-muted-foreground">
                Período: {fromDate.toLocaleDateString('es')} – {toDate.toLocaleDateString('es')}
              </p>
            </PopoverContent>
          </Popover>
        </div>

        <p className="text-sm text-muted-foreground">
          Período: {PERIOD_LABELS[period]}. Visitas = vistas de ficha; Clics = agregar al carrito. &quot;Más comprados&quot; = más veces agregados al carrito.
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Productos más comprados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : !stats?.topPurchasedProducts?.length ? (
              <p className="text-sm text-muted-foreground">
                Aún no hay datos (según agregados al carrito en los últimos 30 días).
              </p>
            ) : (
              <ul className="space-y-2">
                {stats.topPurchasedProducts.map((item, index) => (
                  <li
                    key={item.productId}
                    className="flex items-center justify-between text-sm py-2 border-b border-border last:border-0"
                  >
                    <span className="text-muted-foreground w-6">{index + 1}.</span>
                    <span className="flex-1 truncate font-medium">{item.name}</span>
                    {item.sku && (
                      <span className="text-muted-foreground text-xs shrink-0 ml-2">REF: {item.sku}</span>
                    )}
                    <span className="text-muted-foreground shrink-0 ml-2">
                      {item.addToCartCount} agregados
                    </span>
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
