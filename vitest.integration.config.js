import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: `${__dirname}/.env.test` });

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    testTimeout: 15000,
    include: ['src/tests/integration/**/*.test.{jsx,tsx}'],
    setupFiles: ['src/tests/integration/setup.js'],
  },
});
