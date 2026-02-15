-- Add SKU column to products table
ALTER TABLE public.products 
ADD COLUMN sku TEXT UNIQUE;

-- Create index for faster SKU lookups
CREATE INDEX idx_products_sku ON public.products(sku);

-- Create index for faster name searches
CREATE INDEX idx_products_name ON public.products USING gin(to_tsvector('spanish', name));