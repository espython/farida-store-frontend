import { El_Messiri, Fraunces } from "next/font/google";

/** Kitchen Garden display faces: Fraunces for Latin headings, El Messiri for Arabic. */
export const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-fraunces",
  display: "swap",
});

export const elMessiri = El_Messiri({
  subsets: ["arabic"],
  weight: ["500", "700"],
  variable: "--font-el-messiri",
  display: "swap",
});
