import { supabase } from '../../../lib/supabaseClient';

export const profileService = {
  async getByAuthUserId(authUserId) {
    const { data, error } = await supabase
      .from('recycling_app_user_profiles')
      .select('*')
      .eq('auth_user_id', authUserId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async getByUsername(username) {
    const { data, error } = await supabase
      .from('recycling_app_user_profiles')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async updateProfile(profileId, updates) {
    const { data, error } = await supabase
      .from('recycling_app_user_profiles')
      .update(updates)
      .eq('id', profileId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};