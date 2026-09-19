/// <reference types="vitest/config" />
import react from "@vitejs/plugin-react";
import { getViteConfig } from "astro/config";

// Usa el helper `getViteConfig` de Astro (no un `defineConfig` de vitest a
// secas) para que el módulo virtual `astro:env/server` resuelva también
// dentro de vitest — algunos módulos de solo-servidor (ej. src/lib/site-origin.ts)
// lo importan de forma estática aunque las funciones que se testean no lo
// invoquen en runtime.
export default getViteConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    // El default de 5s alcanza en la mayoría de las corridas, pero
    // MenuExplorer.test.tsx (userEvent tipeando carácter por carácter sobre
    // jsdom) se puso flaky bajo carga de máquina una vez que el suite creció.
    testTimeout: 15000,
  },
});
