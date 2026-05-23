// Keep this config in JS: Next 14 does not discover postcss.config.ts.
/** @type {import("postcss-load-config").Config} */
const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

export default config;
