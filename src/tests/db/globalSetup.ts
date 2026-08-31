import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { TEST_USERS } from './testUsers';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, '../../../.env.test') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    'VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY must be set in .env.test',
  );
}

if (
  !SUPABASE_URL.includes('localhost') &&
  !SUPABASE_URL.includes('127.0.0.1')
) {
  throw new Error(
    'RLS tests must run against a local Supabase instance. ' +
      'Set VITE_SUPABASE_URL to a localhost URL in .env.test.',
  );
}

const createdUserIds: string[] = [];

function getServiceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function ensureUser(
  client: SupabaseClient,
  user: { email: string; password: string; fullName: string },
): Promise<string> {
  const { data, error } = await client.auth.admin.createUser({
    email: user.email,
    password: user.password,
    email_confirm: true,
    user_metadata: { full_name: user.fullName },
  });

  if (!error) return data.user.id;

  // User likely exists from an interrupted previous run — find, delete, recreate
  const { data: listData } = await client.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  const existing = listData?.users?.find((u) => u.email === user.email);
  if (existing) {
    // user_profiles cascades on auth.users delete, no dependent-row cleanup needed
    const { error: deleteError } = await client.auth.admin.deleteUser(
      existing.id,
    );
    if (deleteError)
      throw new Error(
        `Failed to delete stale user ${user.email}: ${deleteError.message}`,
      );
    const { data: retryData, error: retryError } =
      await client.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: { full_name: user.fullName },
      });
    if (retryError)
      throw new Error(
        `Failed to recreate user ${user.email}: ${retryError.message}`,
      );
    return retryData.user.id;
  }

  throw new Error(`Failed to create user ${user.email}: ${error.message}`);
}

export async function setup(): Promise<void> {
  const client = getServiceClient();
  let adminAuthId: string | null = null;

  for (const [key, user] of Object.entries(TEST_USERS)) {
    const id = await ensureUser(client, user);
    createdUserIds.push(id);
    if (key === 'admin') adminAuthId = id;
  }

  // bird_app_handle_new_user trigger created a user_profiles row with role='user';
  // promote the admin user via service role (bypasses column grants + RLS)
  const { error } = await client
    .from('user_profiles')
    .update({ role: 'admin' })
    .eq('auth_user_id', adminAuthId!);
  if (error) throw new Error(`Admin promotion failed: ${error.message}`);
}

export async function teardown(): Promise<void> {
  const client = getServiceClient();
  for (const id of createdUserIds) {
    await client.auth.admin.deleteUser(id);
  }
}