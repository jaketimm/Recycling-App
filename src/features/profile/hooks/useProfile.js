import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../auth/hooks/useAuth';

export function useProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['profile', user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recycling_app_user_profiles')
        .select('id, username, role, created_at')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const setProfile = (updated) => {
    queryClient.setQueryData(['profile', user?.id], updated);
  };

  return {
    profile: query.data ?? null,
    isAdmin: query.data?.role === 'admin',
    isLoading: query.isPending,
    setProfile,
  };
}