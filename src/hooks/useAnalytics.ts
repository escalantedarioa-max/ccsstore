import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const SESSION_ID_KEY = 'analytics_session_id';

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

export type AnalyticsEventType = 'product_view' | 'add_to_cart_click';

/**
 * Registra un evento de analytics (uso en catálogo público).
 * No lanza errores para no afectar la UX.
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  productId?: string | null
): Promise<void> {
  try {
    await supabase.from('analytics_events').insert({
      event_type: eventType,
      product_id: productId || null,
      session_id: getOrCreateSessionId(),
    });
  } catch {
    // Silently ignore analytics errors
  }
}

export interface TopProductRow {
  productId: string;
  name: string;
  sku: string | null;
  viewCount?: number;
  addToCartCount?: number;
}

export interface AnalyticsStats {
  totalProductViews: number;
  totalAddToCartClicks: number;
  topViewedProducts: TopProductRow[];
  topPurchasedProducts: TopProductRow[];
}

export type StatsPeriod = 'today' | 'week' | 'month' | 'year';

/** Devuelve [from, to] en ISO para el periodo dado (to = fin de hoy o ahora). */
export function getStatsDateRange(period: StatsPeriod): { from: string; to: string; fromDate: Date; toDate: Date } {
  const now = new Date();
  const toDate = new Date(now);
  toDate.setHours(23, 59, 59, 999);

  let fromDate = new Date(now);

  switch (period) {
    case 'today': {
      fromDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'week': {
      const day = fromDate.getDay();
      const diff = day === 0 ? 6 : day - 1; // Lunes = inicio de semana
      fromDate.setDate(fromDate.getDate() - diff);
      fromDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'month': {
      fromDate.setDate(1);
      fromDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'year': {
      fromDate.setMonth(0, 1);
      fromDate.setHours(0, 0, 0, 0);
      break;
    }
  }

  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
    fromDate,
    toDate,
  };
}

async function fetchAnalyticsStats(period: StatsPeriod): Promise<AnalyticsStats> {
  const { from, to } = getStatsDateRange(period);

  const [viewsRes, cartsRes, viewEventsRes, cartEventsRes] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'product_view')
      .gte('created_at', from)
      .lte('created_at', to),
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'add_to_cart_click')
      .gte('created_at', from)
      .lte('created_at', to),
    supabase
      .from('analytics_events')
      .select('product_id')
      .eq('event_type', 'product_view')
      .not('product_id', 'is', null)
      .gte('created_at', from)
      .lte('created_at', to)
      .limit(5000),
    supabase
      .from('analytics_events')
      .select('product_id')
      .eq('event_type', 'add_to_cart_click')
      .not('product_id', 'is', null)
      .gte('created_at', from)
      .lte('created_at', to)
      .limit(5000),
  ]);

  const totalProductViews = viewsRes.count ?? 0;
  const totalAddToCartClicks = cartsRes.count ?? 0;

  const viewCounts: Record<string, number> = {};
  for (const row of viewEventsRes.data ?? []) {
    if (row.product_id) {
      viewCounts[row.product_id] = (viewCounts[row.product_id] ?? 0) + 1;
    }
  }
  const cartCounts: Record<string, number> = {};
  for (const row of cartEventsRes.data ?? []) {
    if (row.product_id) {
      cartCounts[row.product_id] = (cartCounts[row.product_id] ?? 0) + 1;
    }
  }

  const sortedViews = Object.entries(viewCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([productId]) => productId);
  const sortedCarts = Object.entries(cartCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([productId]) => productId);

  const allProductIds = [...new Set([...sortedViews, ...sortedCarts])];
  let topViewedProducts: AnalyticsStats['topViewedProducts'] = [];
  let topPurchasedProducts: AnalyticsStats['topPurchasedProducts'] = [];

  if (allProductIds.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku')
      .in('id', allProductIds);
    const byId = new Map((products ?? []).map((p) => [p.id, p]));

    topViewedProducts = sortedViews.map((productId) => ({
      productId,
      name: byId.get(productId)?.name ?? '—',
      sku: byId.get(productId)?.sku ?? null,
      viewCount: viewCounts[productId] ?? 0,
    }));
    topPurchasedProducts = sortedCarts.map((productId) => ({
      productId,
      name: byId.get(productId)?.name ?? '—',
      sku: byId.get(productId)?.sku ?? null,
      addToCartCount: cartCounts[productId] ?? 0,
    }));
  }

  return {
    totalProductViews,
    totalAddToCartClicks,
    topViewedProducts,
    topPurchasedProducts,
  };
}

/**
 * Estadísticas para el panel admin (solo admin/master pueden leer).
 * period: hoy, semana, mes o año.
 */
export function useAnalyticsStats(period: StatsPeriod = 'month') {
  return useQuery({
    queryKey: ['analytics-stats', period],
    queryFn: () => fetchAnalyticsStats(period),
  });
}
