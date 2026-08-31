import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: `${__dirname}/.env.test` });

export default defineConfig({
  test: {
    environment: 'node',
    testTimeout: 15000,
    include: ['src/tests/db/**/*.test.ts'],
    globalSetup: ['src/tests/db/globalSetup.ts'],
    fileParallelism: false,
  },
});