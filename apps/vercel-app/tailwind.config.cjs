const config = require(`@mfng/shared-app/tailwind.config.cjs`);

/** @type {import('tailwindcss').Config} */
module.exports = {
  ...config,
  content: [`./src/**/*.{ts,tsx}`, `../shared-app/src/**/*.{ts,tsx}`],
};
