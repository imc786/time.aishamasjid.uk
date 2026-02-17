import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Test file patterns
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    exclude: ["node_modules", ".next/**"],

    // Global test setup
    setupFiles: ["tests/setup.ts"],

    // Environment
    environment: "node",

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      reportsDirectory: "./coverage",
      include: ["lib/**/*.ts", "hooks/**/*.ts"],
      exclude: ["node_modules/**", "tests/**", "**/*.d.ts", "**/*.test.ts", "**/*.spec.ts"],
      thresholds: {
        lines: 50,
        functions: 50,
        branches: 50,
        statements: 50,
      },
    },

    // Reporter options
    reporters: ["default"],

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Globals (describe, it, expect available without import)
    globals: true,
  },

  // Path aliases matching tsconfig.json
  resolve: {
    alias: {
      "@": resolve(__dirname, "./"),
    },
  },
});
