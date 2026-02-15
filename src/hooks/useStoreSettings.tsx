import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StoreSettings } from '@/types/database';
import { toast } from 'sonner';

export function useStoreSettings() {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as StoreSettings | null;
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  });
}

export function useUpdateStoreSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<StoreSettings>) => {
      // First get existing settings
      const { data: existing } = await supabase
        .from('store_settings')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (existing) {
        const { data, error } = await supabase
          .from('store_settings')
          .update({ ...updates, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data as StoreSettings;
      } else {
        // Insert if not exists
        const { data, error } = await supabase
          .from('store_settings')
          .insert(updates)
          .select()
          .single();
        
        if (error) throw error;
        return data as StoreSettings;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
      toast.success('Configuración actualizada');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar: ' + error.message);
    },
  });
}
