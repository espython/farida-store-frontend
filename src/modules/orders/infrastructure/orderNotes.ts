import type { ReturnReason, ReturnRequest } from "../domain/ReturnRequest";

// Private order notes the shop reads in the Woo order screen (English, like
// the rest of the admin). Woo renders notes as limited HTML, so the customer's
// text is escaped and shows exactly as typed.

const REASONS: Record<ReturnReason, string> = {
  damaged: "Arrived damaged or not working",
  wrong_item: "Wrong item",
  not_as_described: "Not as described",
  changed_mind: "Changed their mind",
  other: "Other",
};

const escapeHtml = (text: string) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const cancelNote = () => "Cancelled by the customer from the storefront.";

export const returnNote = ({ reason, details }: ReturnRequest) =>
  [
    "Return requested by the customer from the storefront.",
    `Reason: ${REASONS[reason]}`,
    ...(details ? [`Details: ${escapeHtml(details)}`] : []),
    "Refund it (status Refunded, restock the items in the refund) or decline it (status Completed).",
  ].join("\n");
