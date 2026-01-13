import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        soil: "#5b3a29",
        leaf: "#4ade80",
        moss: "#16a34a",
      },
    },
  },
  plugins: [],
} satisfies Config;
