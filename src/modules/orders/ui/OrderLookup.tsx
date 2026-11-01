"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { LuPackageSearch } from "react-icons/lu";
import { Link, useRouter } from "@/navigation";
import TextField from "@/shared/ui/TextField";
import Button from "@/shared/ui/Button";
import { parseOrderNumber } from "../domain/Order";

/**
 * Find an order by its number. The visitor is signed in (middleware), and the
 * tracking page only shows their own orders, so the number is enough.
 */
const OrderLookup = () => {
  const t = useTranslations("orders.lookup");
  const router = useRouter();
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  return (
    <section aria-labelledby="order-lookup" className="max-w-xl mx-auto bg-white rounded-3xl p-5 md:p-8 flex flex-col gap-6">
      <div className="flex items-start gap-4">
        <span aria-hidden="true" className="w-12 h-12 shrink-0 grid place-items-center rounded-full bg-sand text-garden text-2xl">
          <LuPackageSearch />
        </span>
        <div className="flex flex-col gap-1">
          <h2 id="order-lookup" className="font-display text-xl md:text-2xl">
            {t("heading")}
          </h2>
          <p className="text-garden-muted">{t("text")}</p>
        </div>
      </div>
      <form
        noValidate
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          const number = parseOrderNumber(value);
          if (!number) return setError(t("invalid"));
          setError("");
          router.push(`/trackorder/${number}`);
        }}
      >
        <TextField
          name="order"
          inputMode="numeric"
          autoComplete="off"
          label={t("label")}
          placeholder={t("placeholder")}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          error={error || undefined}
        />
        <Button type="submit" size="lg" full>
          {t("action")}
        </Button>
      </form>
      <Link href="/userorders" className="self-center text-sm font-semibold underline">
        {t("all")}
      </Link>
    </section>
  );
};

export default OrderLookup;
