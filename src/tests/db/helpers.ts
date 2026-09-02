import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TEST_USERS } from './testUsers';

export { TEST_USERS };

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL!;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY!;
const SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

export interface TestContext {
  client: SupabaseClient;
  authUserId: string;
  profileId: string;
}

function createTestClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Signs in a test user and resolves their profile row.
 * Each call returns an isolated client instance (no shared session state).
 */
export async function authenticatedContext(
  email: string,
  password: string,
): Promise<TestContext> {
  const client = createTestClient();
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw new Error(`Auth failed for ${email}: ${error.message}`);

  const authUserId = data.user!.id;
  const { data: profile, error: profileError } = await client
    .from('recycling_app_user_profiles')
    .select('id')
    .eq('auth_user_id', authUserId)
    .single();
  if (profileError)
    throw new Error(`Profile lookup failed: ${profileError.message}`);

  return { client, authUserId, profileId: profile.id };
}

export async function adminContext(): Promise<TestContext> {
  return authenticatedContext(TEST_USERS.admin.email, TEST_USERS.admin.password);
}

export function anonContext(): { client: SupabaseClient } {
  return {
    client: createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    }),
  };
}

export function serviceClient(): SupabaseClient {
  if (!SERVICE_ROLE_KEY)
    throw new Error('VITE_SUPABASE_SERVICE_ROLE_KEY required for test cleanup');
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
}