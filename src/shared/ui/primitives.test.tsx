import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import Button, { buttonClass } from "./Button";
import TextField from "./TextField";
import EmptyState from "./EmptyState";

describe("shared ui primitives", () => {
  it("Button defaults to type=button and a 44 px primary style", () => {
    render(<Button>Save</Button>);
    const btn = screen.getByRole("button", { name: "Save" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn.className).toContain("h-11");
    expect(buttonClass({ variant: "outline", full: true })).toContain("w-full");
  });

  it("TextField labels its input and wires the error message", () => {
    render(<TextField label="Email" error="Required" />);
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toBeTruthy();
    expect(screen.getByText("Required")).toHaveAttribute("id", input.getAttribute("aria-describedby"));
  });

  it("TextField renders a textarea when multiline and keeps the prop off the DOM", () => {
    render(<TextField label="Message" multiline />);
    const area = screen.getByLabelText("Message");
    expect(area.tagName).toBe("TEXTAREA");
    expect(area).not.toHaveAttribute("multiline");
  });

  it("EmptyState shows title, text and action", () => {
    render(<EmptyState title="Nothing here" text="Try again" action={<a href="/">Home</a>} role="status" />);
    expect(screen.getByRole("status")).toHaveTextContent("Nothing here");
    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  });
});
