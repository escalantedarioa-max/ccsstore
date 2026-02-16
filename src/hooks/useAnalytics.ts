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

export interface AnalyticsStats {
  totalProductViews: number;
  totalAddToCartClicks: number;
  topViewedProducts: { productId: string; name: string; sku: string | null; viewCount: number }[];
}

async function fetchAnalyticsStats(): Promise<AnalyticsStats> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const from = thirtyDaysAgo.toISOString();

  const [viewsRes, cartsRes, eventsRes] = await Promise.all([
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'product_view')
      .gte('created_at', from),
    supabase
      .from('analytics_events')
      .select('id', { count: 'exact', head: true })
      .eq('event_type', 'add_to_cart_click')
      .gte('created_at', from),
    supabase
      .from('analytics_events')
      .select('product_id')
      .eq('event_type', 'product_view')
      .not('product_id', 'is', null)
      .gte('created_at', from)
      .limit(5000),
  ]);

  const totalProductViews = viewsRes.count ?? 0;
  const totalAddToCartClicks = cartsRes.count ?? 0;

  const productIdCounts: Record<string, number> = {};
  for (const row of eventsRes.data ?? []) {
    if (row.product_id) {
      productIdCounts[row.product_id] = (productIdCounts[row.product_id] ?? 0) + 1;
    }
  }

  const sorted = Object.entries(productIdCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([productId]) => productId);

  let topViewedProducts: AnalyticsStats['topViewedProducts'] = [];
  if (sorted.length > 0) {
    const { data: products } = await supabase
      .from('products')
      .select('id, name, sku')
      .in('id', sorted);
    const byId = new Map((products ?? []).map((p) => [p.id, p]));
    topViewedProducts = sorted.map((productId) => ({
      productId,
      name: byId.get(productId)?.name ?? '—',
      sku: byId.get(productId)?.sku ?? null,
      viewCount: productIdCounts[productId] ?? 0,
    }));
  }

  return {
    totalProductViews,
    totalAddToCartClicks,
    topViewedProducts,
  };
}

/**
 * Estadísticas para el panel admin (solo admin/master pueden leer).
 */
export function useAnalyticsStats() {
  return useQuery({
    queryKey: ['analytics-stats'],
    queryFn: fetchAnalyticsStats,
  });
}
