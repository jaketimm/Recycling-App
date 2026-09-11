import { describe, it, expect, beforeAll} from 'vitest';
import {
  authenticatedContext,
  anonContext,
  TEST_USERS,
  type TestContext,
} from './helpers';

describe('recycling_app_material_info RLS', () => {
  let userA: TestContext;

  beforeAll(async () => {
    userA = await authenticatedContext(TEST_USERS.userA.email, TEST_USERS.userA.password);
  });

  describe('select', () => {
    it('user can read material info table', async () => {
      const { data, error } = await userA.client
        .from('recycling_app_material_info')
        .select('*')

      expect(error).toBeNull();
      // table has 40 existing entries
      expect(data).toHaveLength(40);
    });

    it('anon can read material info table', async () => {
      const { client } = anonContext();
      const { data, error } = await client
        .from('recycling_app_material_info')
        .select('*')

      expect(error).toBeNull();
      // table has 40 existing entries
      expect(data).toHaveLength(40);
    });
  });

  describe('update', () => {
    it('user cannot update material info table', async () => {
      const { error } = await userA.client
        .from('recycling_app_material_info')
        .update({ instructions: 'Updated instructions' })
        .eq('material_type', 'pet_plastic_bottle')
        .eq('category', 'plastic');

      // RLS should prevent update
      expect(error).toBeNull();

      const { data } = await userA.client
        .from('recycling_app_material_info')
        .select('instructions')
        .eq('material_type', 'pet_plastic_bottle')
        .eq('category', 'plastic')
        .single();

      // verify instructions are unchanged
      expect(data!.instructions).toBe('Widely accepted curbside. Empty and rinse first. See the linked guide for details.');
    });
  });

  describe('insert', () => {
    it('user cannot insert into material info table', async () => {
      const { error } = await userA.client
        .from('recycling_app_material_info')
        .insert({
          material_type: 'styrofoam',
          category: 'styrofoam',
          display_name: 'Styrofoam',
          is_generally_recyclable: true,
          instructions: 'Recyclable at specialty drop-off locations.',
          source_url: 'https://example.com',
        });

      expect(error).not.toBeNull();

      const { data: selectData, error: selectError } = await userA.client
        .from('recycling_app_material_info')
        .select('*')

      expect(selectError).toBeNull();
      // table has 40 existing entries
      expect(selectData).toHaveLength(40);

    });
  });

  describe('delete', () => {
    it('user cannot delete from material info table', async () => {
      const { error } = await userA.client
        .from('recycling_app_material_info')
        .delete()
        .eq('material_type', 'pet_plastic_bottle')
        .eq('category', 'plastic');

      expect(error).toBeNull();

      const { data: selectData, error: selectError } = await userA.client
        .from('recycling_app_material_info')
        .select('*')

      expect(selectError).toBeNull();
      // table has 40 existing entries
      expect(selectData).toHaveLength(40);

    });
  });
});
