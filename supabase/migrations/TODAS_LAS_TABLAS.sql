-- ============================================================
-- MIGRACIONES COMPLETAS - Chic Catalog
-- Ejecutar todo este archivo en Supabase: SQL Editor → New query → Pegar → Run
-- ============================================================

-- 1. Enum y tabla user_roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles"
ON public.user_roles FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- 2. Tabla products
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    category TEXT NOT NULL DEFAULT 'new',
    sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL'],
    colors TEXT[] DEFAULT ARRAY[]::TEXT[],
    materials TEXT,
    images TEXT[] DEFAULT ARRAY[]::TEXT[],
    is_visible BOOLEAN NOT NULL DEFAULT true,
    is_in_stock BOOLEAN NOT NULL DEFAULT true,
    is_new BOOLEAN NOT NULL DEFAULT false,
    is_premium BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible products"
ON public.products FOR SELECT
USING (is_visible = true);

CREATE POLICY "Admins can view all products"
ON public.products FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update products"
ON public.products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete products"
ON public.products FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Columna SKU e índices en products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON public.products USING gin(to_tsvector('spanish', name));

-- 4. Rol master
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master';

-- 5. Columna stock en products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer NOT NULL DEFAULT 0;

-- 6. Tabla categories
CREATE TABLE IF NOT EXISTS public.categories (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL UNIQUE,
    slug text NOT NULL UNIQUE,
    display_order integer NOT NULL DEFAULT 0,
    is_visible boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view visible categories"
ON public.categories FOR SELECT
USING (is_visible = true);

CREATE POLICY "Admins can view all categories"
ON public.categories FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Admins can insert categories"
ON public.categories FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Admins can update categories"
ON public.categories FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Admins can delete categories"
ON public.categories FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'master'::app_role));

INSERT INTO public.categories (name, slug, display_order) VALUES
('Mujer', 'mujer', 1),
('Hombre', 'hombre', 2),
('Niño', 'nino', 3),
('Accesorios', 'accesorios', 4)
ON CONFLICT (slug) DO NOTHING;

-- 7. Tabla store_settings
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

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view store settings"
ON public.store_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can update store settings"
ON public.store_settings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

CREATE POLICY "Only Master can insert store settings"
ON public.store_settings FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'master'));

INSERT INTO public.store_settings (shop_name, bcv_rate, footer_credits)
SELECT 'Mi Tienda Instagram', 36.50, 'Desarrollado con ❤️ por Tu Desarrollador'
WHERE NOT EXISTS (SELECT 1 FROM public.store_settings LIMIT 1);

-- 8. Función is_master
CREATE OR REPLACE FUNCTION public.is_master(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'master'
  )
$$;

-- 9. Políticas de products para admin y master
DROP POLICY IF EXISTS "Admins can view all products" ON public.products;
CREATE POLICY "Admins and Masters can view all products"
ON public.products FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Admins can insert products" ON public.products;
CREATE POLICY "Admins and Masters can insert products"
ON public.products FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Admins can update products" ON public.products;
CREATE POLICY "Admins and Masters can update products"
ON public.products FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

DROP POLICY IF EXISTS "Admins can delete products" ON public.products;
CREATE POLICY "Admins and Masters can delete products"
ON public.products FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'master'));

-- 10. Storage para imágenes de productos (opcional: puede fallar si ya existe el bucket)
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

CREATE POLICY "Admins can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND public.has_role(auth.uid(), 'admin'));

-- Fin. Tablas: user_roles, products, categories, store_settings + storage product-images
