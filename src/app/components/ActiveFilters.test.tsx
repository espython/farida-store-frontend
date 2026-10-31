import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import ar from "../../../messages/ar.json";

const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("min_price=100&max_price=5000&color=red&sort=newest"),
}));
vi.mock("@/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace }),
}));
vi.mock("@/modules/catalog", () => ({
  CATALOG_SOURCE: "woo",
  useGetColorsQuery: () => ({ data: [{ id: "1", slug: "red", name: "أحمر", hex: "#f00" }] }),
  findColor: (list: { slug: string }[], slug: string) => list.find((c) => c.slug === slug),
}));

import ActiveFilters from "./ActiveFilters";

describe("ActiveFilters", () => {
  it("removes the right URL param from each chip, also in Arabic", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={ar}>
        <ActiveFilters />
      </NextIntlClientProvider>
    );
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(3);
    for (const b of buttons) fireEvent.click(b);
    const urls = replace.mock.calls.map(([u]) => String(u));
    expect(urls[0]).not.toContain("color=");
    expect(urls[1]).not.toContain("min_price=");
    expect(urls[2]).not.toContain("max_price=");
    expect(urls.every((u) => u.includes("sort=newest"))).toBe(true);
    expect(screen.getByText(/5,000/)).toBeInTheDocument();
  });
});
