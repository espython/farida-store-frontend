import { describe, expect, it } from "vitest";
import { decodeEntities, htmlToText } from "./htmlText";

describe("decodeEntities", () => {
  it("decodes named, decimal and hex entities and leaves unknown ones", () => {
    expect(decodeEntities("A &amp; B &#8211; C &#x27;D&#x27; &unknown;")).toBe(
      "A & B – C 'D' &unknown;"
    );
  });

  it("decodes common typographic entities", () => {
    expect(decodeEntities("220&deg;C &times; 2 &ndash; &laquo;new&raquo;")).toBe("220°C × 2 – «new»");
  });
});

describe("htmlToText", () => {
  it("keeps paragraphs and list items as lines", () => {
    expect(
      htmlToText("<p>Non-stick &amp; durable.</p>\n<ul><li>5 pieces</li><li>Oven safe</li></ul>")
    ).toBe("Non-stick & durable.\n\n• 5 pieces\n• Oven safe");
  });

  it("ignores source newlines between tags, as Woo sends them", () => {
    expect(htmlToText("<p>Set.</p>\n<ul>\n<li>5 pieces</li>\n<li>Oven safe</li>\n</ul>\n<p>Warranty</p>")).toBe(
      "Set.\n\n• 5 pieces\n• Oven safe\n\nWarranty"
    );
  });

  it("drops scripts and styles with their content and never revives escaped tags as markup", () => {
    expect(htmlToText('<script>alert(1)</script><style>p{}</style>Hi &lt;b&gt;<img src=x onerror="y">')).toBe(
      "Hi <b>"
    );
  });

  it("turns <br> into a line break and collapses spaces", () => {
    expect(htmlToText("Line&nbsp; one<br/>  line two  ")).toBe("Line one\nline two");
  });

  it("returns an empty string for empty input", () => {
    expect(htmlToText("")).toBe("");
  });
});
