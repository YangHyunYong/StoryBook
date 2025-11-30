// client/postcss.config.mjs

/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {}, // ✅ Tailwind v4용 PostCSS 플러그인 등록
  },
};

export default config;
