import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  authenticatedContext,
  anonContext,
  adminContext,
  serviceClient,
  TEST_USERS,
  type TestContext,
} from './helpers';

describe('recycling_app_submitted_items RLS', () => {
  let userA: TestContext;
  let userB: TestContext;
  let admin: TestContext;
  let seededItemId: string;

  beforeAll(async () => {
    userA = await authenticatedContext(TEST_USERS.userA.email, TEST_USERS.userA.password);
    userB = await authenticatedContext(TEST_USERS.userB.email, TEST_USERS.userB.password);
    admin = await adminContext();

    // seed a submitted item owned by userA
    const { data, error } = await serviceClient()
      .from('recycling_app_submitted_items')
      .insert({
        user_id: userA.profileId,
        image_url: 'https://example.com/photo.jpg',
        material_type: 'pet_plastic_bottle',
        item_description: 'Clear plastic water bottle',
        confidence: 0.95,
      })
      .select('id')
      .single();
    if (error) throw new Error(`seed submitted item failed: ${error.message}`);
    seededItemId = data.id;
  });

  afterAll(async () => {
    // clean up the seeded submitted item
    const { error } = await serviceClient()
      .from('recycling_app_submitted_items')
      .delete()
      .eq('id', seededItemId);
    if (error) throw new Error(`cleanup submitted item failed: ${error.message}`);
  });

  describe('select', () => {
    it('user can read their own submitted items', async () => {
      const { data, error } = await userA.client
        .from('recycling_app_submitted_items')
        .select('*')
        .eq('id', seededItemId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it("user cannot read another user's submitted items", async () => {
      const { data, error } = await userB.client
        .from('recycling_app_submitted_items')
        .select('*')
        .eq('id', seededItemId);

      // RLS filters out rows the user doesn't own; no error, just 0 rows
      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });

    it('admin can read any submitted item', async () => {
      const { data, error } = await admin.client
        .from('recycling_app_submitted_items')
        .select('*')
        .eq('id', seededItemId);

      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });

    it('anon cannot read submitted items', async () => {
      const { client } = anonContext();
      const { data, error } = await client
        .from('recycling_app_submitted_items')
        .select('*')
        .eq('id', seededItemId);

      expect(error).toBeNull();
      expect(data).toHaveLength(0);
    });
  });

  describe('insert', () => {
    it('user can insert their own submitted item', async () => {
      const { data, error } = await userA.client
        .from('recycling_app_submitted_items')
        .insert({
          user_id: userA.profileId,
          image_url: 'https://example.com/photo-2.jpg',
          material_type: 'pet_plastic_bottle',
        })
        .select('id')
        .single();

      expect(error).toBeNull();
      expect(data).not.toBeNull();

      await serviceClient()
        .from('recycling_app_submitted_items')
        .delete()
        .eq('id', data!.id);
    });

    it('user cannot insert an item for another user', async () => {
      const { error } = await userA.client
        .from('recycling_app_submitted_items')
        .insert({
          user_id: userB.profileId,
          image_url: 'https://example.com/photo-3.jpg',
        });

      // insert's WITH CHECK policy rejects mismatched user_id outright
      expect(error).not.toBeNull();
    });
  });

  describe('delete', () => {
    it("user cannot delete another user's submitted item", async () => {
      const { error } = await userB.client
        .from('recycling_app_submitted_items')
        .delete()
        .eq('id', seededItemId);

      expect(error).toBeNull();

      const { data } = await admin.client
        .from('recycling_app_submitted_items')
        .select('*')
        .eq('id', seededItemId);

      // row still exists; delete matched 0 rows under RLS
      expect(data).toHaveLength(1);
    });

    it('user can delete their own submitted item', async () => {
      const { data: inserted, error: insertError } = await serviceClient()
        .from('recycling_app_submitted_items')
        .insert({
          user_id: userA.profileId,
          image_url: 'https://example.com/photo-4.jpg',
        })
        .select('id')
        .single();
      if (insertError) throw new Error(`seed item failed: ${insertError.message}`);

      const { error } = await userA.client
        .from('recycling_app_submitted_items')
        .delete()
        .eq('id', inserted.id);

      expect(error).toBeNull();

      const { data } = await admin.client
        .from('recycling_app_submitted_items')
        .select('*')
        .eq('id', inserted.id);

      expect(data).toHaveLength(0);
    });
  });
});
