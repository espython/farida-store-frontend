"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "react-toastify";
import Button from "@/shared/ui/Button";
import type { Order } from "../domain/Order";
import { useOrderActions } from "../application/useOrderActions";
import ReturnForm from "./ReturnForm";
import { formatDate } from "./format";

const panel = "bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4";

/**
 * Under the order: cancel it while it can still be cancelled, ask for a
 * return within the return window, or see that a return was requested.
 * Nothing is shown when neither applies.
 */
const OrderActions = ({ order }: { order: Order }) => {
  const t = useTranslations("orders.actions");
  const locale = useLocale();
  const id = useId();
  const actions = useOrderActions(order);
  const [confirming, setConfirming] = useState(false);
  const [returning, setReturning] = useState(false);
  const [cancelFailure, setCancelFailure] = useState<"not_cancellable" | "unavailable" | null>(null);
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (confirming) confirmRef.current?.focus();
  }, [confirming]);

  if (order.status === "return_requested") {
    return (
      <section aria-labelledby={`${id}-title`} className={panel}>
        <h2 id={`${id}-title`} className="font-display text-xl">
          {t("returnRequested.title")}
        </h2>
        <p className="text-garden-muted">{t("returnRequested.text")}</p>
      </section>
    );
  }

  if (actions.canCancel) {
    const cancel = async () => {
      setCancelFailure(null);
      const result = await actions.cancel();
      if (result.ok) {
        setConfirming(false);
        toast.success(t("cancel.done", { number: order.id }), { toastId: `cancelled-${order.id}` });
      } else {
        setConfirming(false);
        setCancelFailure(result.code);
      }
    };
    return (
      <section aria-labelledby={`${id}-title`} className={panel}>
        <h2 id={`${id}-title`} className="font-display text-xl">
          {t("cancel.title")}
        </h2>
        {confirming ? (
          <div role="group" aria-labelledby={`${id}-confirm`} className="flex flex-col gap-4 rounded-2xl bg-[#fde8e6] p-4">
            <p id={`${id}-confirm`} className="font-semibold text-[#b42318]">
              {t("cancel.confirm", { number: order.id })}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button ref={confirmRef} variant="danger" onClick={cancel} disabled={actions.cancelling}>
                {actions.cancelling ? t("cancel.cancelling") : t("cancel.yes")}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={actions.cancelling}>
                {t("cancel.keep")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-garden-muted">{t("cancel.text")}</p>
            <div>
              <Button variant="outline" onClick={() => setConfirming(true)}>
                {t("cancel.action")}
              </Button>
            </div>
          </>
        )}
        {cancelFailure && (
          <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
            {t(`cancel.errors.${cancelFailure}`)}
          </p>
        )}
      </section>
    );
  }

  if (actions.canRequestReturn && actions.returnDeadline) {
    const until = formatDate(actions.returnDeadline.toISOString(), locale);
    return (
      <section aria-labelledby={`${id}-title`} className={panel}>
        <h2 id={`${id}-title`} className="font-display text-xl">
          {t("return.title")}
        </h2>
        <p className="text-garden-muted">{t("return.text", { date: until })}</p>
        {returning ? (
          <ReturnForm
            submit={async (input) => {
              const result = await actions.requestReturn(input);
              if (result.ok) {
                setReturning(false);
                toast.success(t("return.done"), { toastId: `return-${order.id}` });
              }
              return result;
            }}
            submitting={actions.requestingReturn}
            onCancel={() => setReturning(false)}
          />
        ) : (
          <div>
            <Button variant="outline" onClick={() => setReturning(true)}>
              {t("return.action")}
            </Button>
          </div>
        )}
      </section>
    );
  }

  return null;
};

export default OrderActions;
