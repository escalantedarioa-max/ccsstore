-- Paso 1: Añadir rol 'master' al enum existente
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'master';