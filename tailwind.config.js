/** @type {import('tailwindcss').Config} */
import { nextui } from "@nextui-org/react";
export const content = [
  "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/modules/**/*.{js,ts,jsx,tsx,mdx}",
  "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
];
export const theme = {
  extend: {
    container: {
      center: true,
      padding: "15px",
    },
    colors: {
      accent: "#ff8f9c",
      blackish: "#1b1b1b",
      // Legacy names, remapped to the Kitchen Garden palette so untouched pages match.
      mainWhite: "#ffffff",
      mainBlack: "#1c2b22",
      mainPink: "#2d5a40",
      mainDarkBlue: "#1e3a2b",
      mainGray: "#f6f5ef",
      // Kitchen Garden palette (style B).
      garden: { DEFAULT: "#1e3a2b", 600: "#2d5a40", muted: "#55685c" },
      cream: "#f6f5ef",
      sand: "#ebe8da",
      line: "#dcdacb",
      saffron: { DEFAULT: "#e9c46a", ink: "#8a5a00" },
    },

    fontFamily: {
      cairo: ["cairo", "sans-serif"],
      display: ["var(--font-display)", "Georgia", "serif"],
      rubik: ["rubik", "sans-serif"],
    },
    // fontSize: {
    //   xs:"7rem"
    // },
    screens: {
      lmob: "425px",
      medmob: "375px",
      smob: "320px",
    },
  },
};

export const darkMode = "class";

// NextUI components (Select, Checkbox, Modal, Pagination, Spinner...) take the Kitchen Garden palette.
export const plugins = [
  nextui({
    layout: {
      radius: { small: "8px", medium: "12px", large: "20px" },
    },
    themes: {
      light: {
        colors: {
          background: "#f6f5ef",
          foreground: "#1e3a2b",
          focus: "#2d5a40",
          primary: { DEFAULT: "#1e3a2b", foreground: "#f6f5ef" },
          secondary: { DEFAULT: "#e9c46a", foreground: "#1e3a2b" },
          success: { DEFAULT: "#2d5a40", foreground: "#f6f5ef" },
        },
      },
    },
  }),
];
