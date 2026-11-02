import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { Provider } from "react-redux";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import en from "../../../../messages/en.json";
import { makeStore } from "@/store";
import type { Promotions } from "../domain/Promotion";

vi.mock("@/navigation", () => ({
  Link: ({ href, children, ...rest }: { href: string; children: ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));
// Swiper needs layout APIs jsdom lacks; render the slides plainly.
vi.mock("swiper/react", () => ({
  Swiper: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  SwiperSlide: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
vi.mock("swiper/modules", () => ({ A11y: {}, Autoplay: {}, EffectFade: {}, Pagination: {} }));
const api = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("../application/contentApi", () => ({ contentApi: { useGetPromotionsQuery: api.query } }));

import AnnouncementBar from "./AnnouncementBar";
import MiniPromos from "./MiniPromos";
import HeroBanners from "./HeroBanners";

const promos = (over: Partial<Promotions> = {}): Promotions => ({ hero: [], announcements: [], mini: [], ...over });
let store = makeStore();
const wrap = (ui: ReactNode) =>
  render(
    <Provider store={store}>
      <NextIntlClientProvider locale="en" messages={en}>
        {ui}
      </NextIntlClientProvider>
    </Provider>
  );

beforeEach(() => {
  store = makeStore();
  api.query.mockReset();
});

describe("content UI", () => {
  it("shows announcements with their links and hides them for the visit when closed", async () => {
    api.query.mockReturnValue({
      data: promos({
        announcements: [
          { id: "1", placement: "announcement", text: "Free delivery", image: null, link: { kind: "internal", href: "/products" } },
          { id: "2", placement: "announcement", text: "Warranty", image: null, link: { kind: "external", href: "https://help.example" } },
        ],
      }),
    });
    wrap(<AnnouncementBar />);
    expect(api.query).toHaveBeenCalledWith("en");
    expect(screen.getByRole("complementary", { name: "Shop announcements" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Free delivery" })).toHaveAttribute("href", "/products");
    expect(screen.getByRole("link", { name: "Warranty" })).toHaveAttribute("rel", "noopener noreferrer");
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Hide announcements" })));
    expect(screen.queryByText("Free delivery")).not.toBeInTheDocument();
  });

  it("renders nothing while loading or without promotions", () => {
    api.query.mockReturnValue({ data: undefined });
    const { container } = wrap(
      <>
        <AnnouncementBar />
        <MiniPromos />
        <HeroBanners />
      </>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows mini-ads and hero banners with text alternatives", () => {
    api.query.mockReturnValue({
      data: promos({
        mini: [{ id: "5", placement: "mini", text: "New cookware sets", image: null, link: null }],
        hero: [{ id: "7", placement: "hero", text: "Kitchen week sale", image: { url: "https://wp.test/a.jpg", width: 1600, height: 900, alt: "" }, link: { kind: "internal", href: "/categories/blenders" } }],
      }),
    });
    wrap(
      <>
        <MiniPromos />
        <HeroBanners />
      </>
    );
    expect(screen.getByText("New cookware sets")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Promotions" })).toBeInTheDocument();
    const img = screen.getByRole("img", { name: "Kitchen week sale" });
    expect(img).toHaveAttribute("width", "1600");
    expect(img.closest("a")).toHaveAttribute("href", "/categories/blenders");
  });
});
