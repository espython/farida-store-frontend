import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { axeViolations } from "./axe";

describe("axeViolations", () => {
  it("names real problems (so an empty list means something)", async () => {
    const { container } = render(
      <div>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img src="/x.png" />
        <button type="button" />
        <input type="text" />
      </div>
    );
    const found = (await axeViolations(container)).map((v) => v.split(":")[0]);
    expect(found).toEqual(expect.arrayContaining(["image-alt", "button-name", "label"]));
  });
});
