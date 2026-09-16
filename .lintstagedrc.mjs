const config = {
  "*.{ts,tsx,mts,mjs,js,jsx}": (archivos) => {
    const lista = archivos.map((a) => JSON.stringify(a)).join(" ");
    return [
      `prettier --write ${lista}`,
      `eslint --max-warnings=0 --no-warn-ignored ${lista}`,
      `vitest related --run --passWithNoTests ${lista}`,
    ];
  },
  "*.{json,css,yml,yaml}": (archivos) =>
    `prettier --write ${archivos.map((a) => JSON.stringify(a)).join(" ")}`,
};

export default config;
