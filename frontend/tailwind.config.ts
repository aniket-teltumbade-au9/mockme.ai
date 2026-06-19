import { type Config } from "tailwindcss";

export default {
  content: [
    "./src/**/*.tsx",
    "./src/**/*.ts",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#4f46e5", // Indigo 600
        },
        accent: {
          DEFAULT: "#10b981", // Emerald 500
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
