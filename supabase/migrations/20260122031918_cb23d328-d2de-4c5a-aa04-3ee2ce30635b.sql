-- Drop restrictive policies and create permissive ones for categories
DROP POLICY IF EXISTS "Admins and Masters can manage categories" ON public.categories;
DROP POLICY IF EXISTS "Anyone can view visible categories" ON public.categories;

-- Create permissive policies
CREATE POLICY "Anyone can view visible categories"
ON public.categories
FOR SELECT
USING (is_visible = true);

CREATE POLICY "Admins can view all categories"
ON public.categories
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Admins can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Admins can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));

CREATE POLICY "Admins can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'master'::app_role));