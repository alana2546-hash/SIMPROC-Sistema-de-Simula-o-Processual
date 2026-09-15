import { config } from "dotenv";
import { defineConfig } from "vitest/config";

config({ path: ".env.local" });

// Testes de permissão contra o projeto Supabase real, cada teste dentro de
// uma transação que termina em ROLLBACK (não deixa dados).
export default defineConfig({
  test: {
    include: ["tests/rls/**/*.test.ts"],
    fileParallelism: false,
    testTimeout: 30_000,
  },
});
