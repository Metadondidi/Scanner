import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        green: {
          brand: "#2d7a4f",
          light: "#e8f5ee",
        },
        red: {
          brand: "#c0392b",
          light: "#fdf0ef",
        },
      },
    },
  },
  plugins: [],
};

export default config;
