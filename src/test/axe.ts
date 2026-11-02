import axe from "axe-core";

/**
 * Accessibility violations (axe-core, WCAG 2.1 A/AA) in a rendered container,
 * as "rule: element" strings so a failing test names the problem (#195).
 * Colour contrast and page landmarks need a real browser and a whole page,
 * so jsdom checks the rest: names, labels, roles, ARIA, alt text, nesting.
 */
export async function axeViolations(container: Element): Promise<string[]> {
  const result = await axe.run(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
    rules: { "color-contrast": { enabled: false }, region: { enabled: false }, "landmark-one-main": { enabled: false }, "page-has-heading-one": { enabled: false } },
  });
  return result.violations.flatMap((v) => v.nodes.map((n) => `${v.id}: ${n.target.join(" ")} (${v.help})`));
}
