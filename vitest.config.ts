import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 20000,
    hookTimeout: 30000,
    fileParallelism: false,
    server: {
      deps: {
        // Keep the test harness and the Firebase SDK on one module graph,
        // otherwise compat/firestore registers on a different `firebase` copy.
        inline: [/@firebase\/rules-unit-testing/, /^firebase/],
      },
    },
  },
});
