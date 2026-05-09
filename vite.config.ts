import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dashboard imports JSON from ../analytics-seed/ as the canonical data source.
// fs.allow lets Vite serve those files in dev; bundling embeds them in the build.
export default defineConfig({
  plugins: [react()],
  server: {
    fs: {
      allow: ['..', '.'],
    },
  },
});
