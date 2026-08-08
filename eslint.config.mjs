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
  ]),
  {
    rules: {
      // Cho phép pattern fetch-on-mount / đọc localStorage trong effect (client component).
      // Sẽ thay bằng data library ở giai đoạn sau; giữ ở mức cảnh báo để không chặn build.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
