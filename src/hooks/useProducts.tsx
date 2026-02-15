import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DBProduct, ProductFormData } from '@/types/database';
import { toast } from 'sonner';

export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as DBProduct[];
    },
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .maybeSingle();
      
      if (error) throw error;
      return data as DBProduct | null;
    },
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: ProductFormData & { images: string[]; stock?: number }) => {
      const stockValue = product.stock ?? 0;
      const { data, error } = await supabase
        .from('products')
        .insert({
          sku: product.sku || null,
          name: product.name,
          price: product.price,
          description: product.description || null,
          category: product.category,
          sizes: product.sizes,
          colors: product.colors,
          materials: product.materials || null,
          images: product.images,
          is_new: product.is_new,
          is_premium: product.is_premium,
          stock: stockValue,
          is_in_stock: stockValue > 0,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as DBProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al crear producto: ' + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DBProduct> & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as DBProduct;
    },
    onMutate: async (newProduct) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['products'] });

      // Snapshot previous value
      const previousProducts = queryClient.getQueryData<DBProduct[]>(['products']);

      // Optimistically update
      if (previousProducts) {
        queryClient.setQueryData<DBProduct[]>(['products'], (old) =>
          old?.map((p) => (p.id === newProduct.id ? { ...p, ...newProduct } : p))
        );
      }

      return { previousProducts };
    },
    onError: (error: Error, _, context) => {
      // Rollback on error
      if (context?.previousProducts) {
        queryClient.setQueryData(['products'], context.previousProducts);
      }
      toast.error('Error al actualizar: ' + error.message);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onSuccess: () => {
      toast.success('Producto actualizado');
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar: ' + error.message);
    },
  });
}

export function useDuplicateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: DBProduct) => {
      const { data, error } = await supabase
        .from('products')
        .insert({
          sku: product.sku ? product.sku + '-COPY' : null,
          name: product.name + ' (Copia)',
          price: product.price,
          description: product.description,
          category: product.category,
          sizes: product.sizes,
          colors: product.colors,
          materials: product.materials,
          images: product.images,
          is_new: product.is_new,
          is_premium: product.is_premium,
          is_visible: false,
          is_in_stock: product.is_in_stock,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as DBProduct;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto duplicado');
    },
    onError: (error: Error) => {
      toast.error('Error al duplicar: ' + error.message);
    },
  });
}
