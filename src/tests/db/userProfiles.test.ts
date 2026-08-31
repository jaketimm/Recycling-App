import { describe, it, expect, beforeAll } from 'vitest';
import {
  authenticatedContext,
  adminContext,
  anonContext,
  TEST_USERS,
  type TestContext,
} from './helpers';

describe('recycling_app_user_profiles RLS', () => {
  let userA: TestContext;
  let userB: TestContext;
  let admin: TestContext;

  beforeAll(async () => {
    userA = await authenticatedContext(TEST_USERS.userA.email, TEST_USERS.userA.password);
    userB = await authenticatedContext(TEST_USERS.userB.email, TEST_USERS.userB.password);
    admin = await adminContext();
  });

  describe('select', () => {
    it('owner can read own profile', async () => {
      const { data, error } = await userA.client
        .from('recycling_app_user_profiles')
        .select('id, username, role')
        .eq('id', userA.profileId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data![0].id).toBe(userA.profileId);
      expect(data![0].role).toBe('user');
    });

    it('user cannot read another user\'s profile', async () => {
      const { data, error } = await userA.client
        .from('recycling_app_user_profiles')
        .select('id')
        .eq('id', userB.profileId);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('admin can read all profiles', async () => {
      const { data, error } = await admin.client
        .from('recycling_app_user_profiles')
        .select('id');

      expect(error).toBeNull();
      expect(data!.length).toBeGreaterThanOrEqual(3);
    });

    it('anon cannot read any profiles', async () => {
      const { client } = anonContext();
      const { data } = await client.from('recycling_app_user_profiles').select('id');

      expect(data?.length ?? 0).toBe(0);
    });
  });

  describe('update', () => {
    it('owner can update own username', async () => {
      const newName = `Updated ${Date.now()}`;
      const { error } = await userA.client
        .from('recycling_app_user_profiles')
        .update({ username: newName })
        .eq('id', userA.profileId);

      expect(error).toBeNull();

      const { data } = await userA.client
        .from('recycling_app_user_profiles')
        .select('username')
        .eq('id', userA.profileId)
        .single();

      expect(data!.username).toBe(newName);
    });

    it('user cannot update another user\'s profile', async () => {
      const { data } = await userA.client
        .from('recycling_app_user_profiles')
        .update({ username: 'Hacked' })
        .eq('id', userB.profileId)
        .select();

      // RLS silently filters — zero rows affected, no error
      expect(data?.length ?? 0).toBe(0);
    });

    it('user cannot escalate own role (column grant)', async () => {
      const { error } = await userA.client
        .from('recycling_app_user_profiles')
        .update({ role: 'admin' } as any)
        .eq('id', userA.profileId);

      expect(error).not.toBeNull();
      expect(error!.code).toBe('42501');
    });

    it('admin also cannot change role through the API (column grant)', async () => {
      const { error } = await admin.client
        .from('recycling_app_user_profiles')
        .update({ role: 'user' } as any)
        .eq('id', admin.profileId);

      expect(error).not.toBeNull();
      expect(error!.code).toBe('42501');
    });
  });

  describe('insert', () => {
    it('user cannot directly insert a profile', async () => {
      const { error } = await userA.client.from('recycling_app_user_profiles').insert({
        auth_user_id: userA.authUserId,
        username: 'Duplicate',
        role: 'user',
      });

      expect(error).not.toBeNull();
    });
  });

  describe('delete', () => {
    it('user cannot delete own profile', async () => {
      const { data } = await userA.client
        .from('recycling_app_user_profiles')
        .delete()
        .eq('id', userA.profileId)
        .select();

      expect(data?.length ?? 0).toBe(0);
    });
  });
});
