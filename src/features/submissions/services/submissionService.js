import { supabase } from '../../../lib/supabaseClient';

const BUCKET = 'recycling-photos';

export const submissionService = {
  
  async listSubmissions(authUserId) {
    const { data: profile, error: profileError } = await supabase
      .from('recycling_app_user_profiles')
      .select('id').eq('auth_user_id', authUserId).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return [];

    const { data, error } = await supabase.from('recycling_app_submitted_items')
      .select('id, user_id, image_url, material_type, item_description, created_at, material:recycling_app_material_info(display_name, is_generally_recyclable)')
      .eq('user_id', profile.id).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async removeSubmission(submission, authUserId) {
    // Only remove photos from the signed-in user's folder in this app's bucket.
    const { data: bucket } = supabase.storage.from(BUCKET).getPublicUrl('');
    const baseUrl = bucket.publicUrl.endsWith('/') ? bucket.publicUrl : `${bucket.publicUrl}/`;
    if (!submission.image_url.startsWith(baseUrl)) {
      throw new Error('This photo has an unexpected storage location.');
    }
    const path = decodeURIComponent(submission.image_url.slice(baseUrl.length));
    if (!path.startsWith(`${authUserId}/`) || path.split('/').length !== 2) {
      throw new Error('This photo does not belong to your account.');
    }

    // Keep the record if storage fails, so deletion can be retried.
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([path]);
    if (storageError) throw storageError;
    const { data, error } = await supabase.from('recycling_app_submitted_items').delete()
      .eq('id', submission.id).eq('user_id', submission.user_id).select('id');
    if (error) throw error;
    if (!data?.length) throw new Error('The submission could not be deleted. Refresh and try again.');
  },
};
