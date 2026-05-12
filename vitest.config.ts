import { defineConfig } from "vitest/config";
import path from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    exclude: ["node_modules", "tests/e2e/receipt.spec.ts"],

    // Coverage via @vitest/coverage-v8
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      reportsDirectory: "./coverage",
      include: ["src/lib/**/*.ts"],
      exclude: [
        "src/lib/db/**",            // Supabase client — no logic to unit test
        "**/*.d.ts",
        "**/index.ts",
      ],
      // Thresholds — CI will fail if coverage drops below these
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 50,
        statements: 60,
      },
    },
  },
});
