import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import {
  authenticatedContext,
  anonContext,
  serviceClient,
  TestContext,
  TEST_USERS
} from './helpers';

const BUCKET = 'recycling-photos';

describe('storage RLS – image bucket', () => {
  let userA: TestContext;
  let userB: TestContext;
  let anon: ReturnType<typeof anonContext>;
  const svc = serviceClient();
  const cleanupPaths: string[] = [];

  beforeAll(async () => {
    userA = await authenticatedContext(TEST_USERS.userA.email, TEST_USERS.userA.password);
    userB = await authenticatedContext(TEST_USERS.userB.email, TEST_USERS.userB.password);
    anon = anonContext();
  });

  afterAll(async () => {
    if (cleanupPaths.length) {
      await svc.storage.from(BUCKET).remove(cleanupPaths);
    }
  });

  const testFile = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]); // PNG header bytes
  const unique = () => `rls-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;

  // helper — upload via service role so the file definitely exists
  async function seedFile(path: string) {
    const { error } = await svc.storage
      .from(BUCKET)
      .upload(path, testFile, { contentType: 'image/webp', upsert: true });
    if (error) throw error;
    cleanupPaths.push(path);
  }

  // ── UPLOAD ──────────────────────────────────────────
  describe('user uploads', () => {
    it('user can upload to own folder', async () => {
      const path = `${userA.authUserId}/${unique()}`;
      const { error } = await userA.client.storage
        .from(BUCKET)
        .upload(path, testFile, { contentType: 'image/webp' });

      cleanupPaths.push(path);
      expect(error).toBeNull();
    });

    it('user CANNOT upload to another user folder', async () => {
      const path = `${userB.authUserId}/${unique()}`;
      const { error } = await userA.client.storage
        .from(BUCKET)
        .upload(path, testFile, { contentType: 'image/webp' });

      if (!error) cleanupPaths.push(path);
      expect(error).not.toBeNull();
    });
  });

  describe('disallowed paths', () => {
    it('anon CANNOT upload', async () => {
      const path = `${userA.authUserId}/${unique()}`;
      const { error } = await anon.client.storage
        .from(BUCKET)
        .upload(path, testFile, { contentType: 'image/webp' });

      if (!error) cleanupPaths.push(path);
      expect(error).not.toBeNull();
    });
  });

  // ── DELETE ──────────────────────────────────────────
  describe('DELETE', () => {
    it('user can delete own object', async () => {
      const path = `${userA.authUserId}/${unique()}`;
      await userA.client.storage
        .from(BUCKET)
        .upload(path, testFile, { contentType: 'image/webp' });

      const { error } = await userA.client.storage.from(BUCKET).remove([path]);
      expect(error).toBeNull();

      // Confirm it's gone
      const { data } = await svc.storage.from(BUCKET).download(path);
      expect(data).toBeNull();
    });

    it('user CANNOT delete another user object', async () => {
      const path = `${userA.authUserId}/${unique()}`;
      await seedFile(path);

      // User B attempts delete
      await userB.client.storage.from(BUCKET).remove([path]);

      // File must still exist — verify via service role
      const { data, error } = await svc.storage.from(BUCKET).download(path);
      expect(error).toBeNull();
      expect(data).not.toBeNull();
    });
  });

  // ── PUBLIC READ ─────────────────────────────────────
  describe('public read', () => {
    it('public URL is accessible without auth', async () => {
      const path = `${userA.authUserId}/${unique()}`;
      await seedFile(path);

      const { data: { publicUrl } } = svc.storage.from(BUCKET).getPublicUrl(path);

      const res = await fetch(publicUrl);
      expect(res.ok).toBe(true);
    });
  });
});