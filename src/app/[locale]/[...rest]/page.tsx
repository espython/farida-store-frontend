import { notFound } from "next/navigation";

// Unmatched URLs under a locale never reached [locale]/not-found.tsx and
// rendered a blank error document. Catch them here so the styled 404 shows
// inside the site chrome (next-intl's documented pattern).
export default function CatchAll() {
  notFound();
}
