-- 2. Añadir columna stock numérico a products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0;

-- 3. Crear tabla de categorías dinámicas
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    display_order integer NOT NULL DEFAULT 0,
    is_visible boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS en categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Políticas para categories
CREATE POLICY "Anyone can view visible categories"
ON public.categories FOR SELECT
USING (is_visible = true);

CREATE POLICY "Admins and Masters can manage categories"
ON public.categories FOR ALL
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

-- Insertar categorías iniciales
INSERT INTO public.categories (name, slug, display_order) VALUES
('Mujer', 'mujer', 1),
('Hombre', 'hombre', 2),
('Niño', 'nino', 3),
('Accesorios', 'accesorios', 4)
ON CONFLICT (slug) DO NOTHING;

-- 4. Crear tabla store_settings para configuración global
CREATE TABLE IF NOT EXISTS public.store_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shop_name text NOT NULL DEFAULT 'Mi Tienda',
    shop_logo_url text,
    bcv_rate numeric NOT NULL DEFAULT 1.0,
    footer_credits text DEFAULT 'Desarrollado con ❤️',
    developer_logo_url text,
    contact_whatsapp text,
    contact_instagram text,
    contact_email text,
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS en store_settings
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Políticas para store_settings
CREATE POLICY "Anyone can view store settings"
ON public.store_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update store settings except footer"
ON public.store_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

CREATE POLICY "Only Master can insert store settings"
ON public.store_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'master'));

-- Insertar configuración inicial sin conflicto
INSERT INTO public.store_settings (shop_name, bcv_rate, footer_credits)
SELECT 'Mi Tienda Instagram', 36.50, 'Desarrollado con ❤️ por Tu Desarrollador'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings LIMIT 1);

-- 5. Crear función para verificar si es master
CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'master'
  )
$$;

-- 6. Actualizar políticas de productos para incluir master
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Admins and Masters can view all products"
ON public.products FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins and Masters can insert products"
ON public.products FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins and Masters can update products"
ON public.products FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins and Masters can delete products"
ON public.products FOR DELETE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));