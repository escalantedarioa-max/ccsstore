-- Tabla de eventos de analytics (una BD por tienda, sin store_id)
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type text NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
    session_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para consultas del dashboard
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_product_id ON public.analytics_events(product_id);

-- RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar (catálogo público envía eventos)
CREATE POLICY "Allow insert analytics_events"
ON public.analytics_events FOR INSERT
WITH CHECK (true);

-- Solo admin/master pueden leer (panel de estadísticas)
CREATE POLICY "Admins can read analytics_events"
ON public.analytics_events FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));
