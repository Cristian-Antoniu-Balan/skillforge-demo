// Configurație PostCSS — conectează Tailwind v4 la pipeline-ul de build Next.js.
// Fără acest fișier, directivele @import "tailwindcss" din globals.css n-ar fi procesate.
const config = {
  plugins: {
    "@tailwindcss/postcss": {}
  }
};

export default config;
