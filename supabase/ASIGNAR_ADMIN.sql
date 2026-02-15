-- ============================================================
-- Asignar rol ADMIN a un usuario
-- ============================================================
-- 1. En Supabase: Authentication → Users → clic en tu usuario
-- 2. Copia el "User UID" (ej: a1b2c3d4-e5f6-7890-abcd-ef1234567890)
-- 3. Sustituye abajo TU_USER_UID por ese valor (entre comillas)
-- 4. SQL Editor → Pegar → Run
-- 5. Cierra sesión en el catálogo y vuelve a entrar
-- ============================================================

-- Ver si ya tienes algún rol (opcional, para comprobar):
-- SELECT * FROM public.user_roles WHERE user_id = 'TU_USER_UID';

-- Asignar admin (sustituye TU_USER_UID):
INSERT INTO public.user_roles (user_id, role)
VALUES ('TU_USER_UID', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
