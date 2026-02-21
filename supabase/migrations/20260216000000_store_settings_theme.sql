-- Añadir columna theme (skin) a store_settings para apariencia del catálogo
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS theme text NOT NULL DEFAULT 'moderno';

COMMENT ON COLUMN public.store_settings.theme IS 'Skin/apariencia del catálogo: moderno, clasico, dama, caballero, ninos, mixto, lenceria, hogar';
