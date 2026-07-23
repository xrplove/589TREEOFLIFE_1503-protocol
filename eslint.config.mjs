import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Supabase Edge Functions corren en Deno (no en el bundle de Next) y tienen
    // su propio linter (deno lint · cada fichero lleva `deno-lint-ignore-file`).
    // El ESLint de Next no es su autoridad: el interop con el cliente Supabase
    // anónimo/service usa `any` de forma deliberada. Fuera del scope del app.
    "supabase/functions/**",
  ]),
]);

export default eslintConfig;
