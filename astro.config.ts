import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, envField } from "astro/config";

import vercel from "@astrojs/vercel";

export default defineConfig({
  output: "server",
  adapter: vercel(),
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()],
  },

  env: {
    schema: {
      SUMUP_API_KEY: envField.string({ context: "server", access: "secret" }),
      SUMUP_MERCHANT_CODE: envField.string({
        context: "server",
        access: "secret",
      }),
      UPSTASH_REDIS_REST_URL: envField.string({
        context: "server",
        access: "secret",
      }),
      UPSTASH_REDIS_REST_TOKEN: envField.string({
        context: "server",
        access: "secret",
      }),
      RESEND_API_KEY: envField.string({ context: "server", access: "secret" }),
      ORDER_NOTIFY_EMAIL_FROM: envField.string({
        context: "server",
        access: "secret",
      }),
      ORDER_NOTIFY_EMAIL_TO: envField.string({
        context: "server",
        access: "secret",
      }),
      SITE_URL: envField.string({
        context: "server",
        access: "secret",
        optional: true,
      }),
    },
  },
});
