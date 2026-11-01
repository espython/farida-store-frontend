"use client";
import { useId, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LuMapPin, LuPencil, LuPlus, LuStar, LuTrash2 } from "react-icons/lu";
import Badge from "@/shared/ui/Badge";
import Button from "@/shared/ui/Button";
import EmptyState from "@/shared/ui/EmptyState";
import AddressForm, { type AddressFormResult } from "@/shared/ui/AddressForm";
import { emptyAddress, type Address } from "@/shared/kernel/Address";
import { governorateName } from "@/shared/kernel/Governorate";
import type { SavedAddress } from "../domain/AddressBook";
import type { AccountResult } from "../application/accountFailure";
import { useAddressBook } from "../application/useAccount";
import { AccountLoading, AccountSignIn, AccountUnavailable } from "./AccountStates";

type Editing = { mode: "new" } | { mode: "edit"; entry: SavedAddress } | null;

const useFailureText = () => {
  const t = useTranslations("account.addresses");
  return (r: AccountResult): AddressFormResult =>
    r.ok
      ? r
      : {
          ok: false,
          fields: r.failure.fields as Extract<AddressFormResult, { ok: false }>["fields"],
          message: r.failure.code === "invalid" ? undefined : t(`errors.${r.failure.code}`),
        };
};

/** Add or edit form, with "use as default" (checked and fixed for the first address). */
const EntryForm = ({ editing, isOnly, onDone }: { editing: Exclude<Editing, null>; isOnly: boolean; onDone: () => void }) => {
  const t = useTranslations("account.addresses");
  const book = useAddressBook();
  const toResult = useFailureText();
  const checkId = useId();
  const current = editing.mode === "edit" ? editing.entry : null;
  const [asDefault, setAsDefault] = useState(current?.isDefault ?? isOnly);
  const locked = isOnly || Boolean(current?.isDefault);

  const save = async (address: Address) => {
    const r = current ? await book.update(current.id, address, asDefault) : await book.add(address, asDefault);
    if (r.ok) onDone();
    return toResult(r);
  };

  return (
    <section aria-labelledby={`${checkId}-title`} className="bg-white rounded-3xl p-5 md:p-8 flex flex-col gap-5">
      <h2 id={`${checkId}-title`} className="font-display text-xl md:text-2xl">
        {current ? t("editTitle") : t("newTitle")}
      </h2>
      <AddressForm
        initial={current?.address ?? emptyAddress()}
        busy={book.busy}
        onSubmit={save}
        submitLabel={t("save")}
        secondary={
          <Button variant="ghost" onClick={onDone}>
            {t("cancel")}
          </Button>
        }
      >
        <label htmlFor={checkId} className="flex items-start gap-3 cursor-pointer">
          <input
            id={checkId}
            type="checkbox"
            checked={asDefault || locked}
            disabled={locked}
            onChange={(e) => setAsDefault(e.target.checked)}
            className="mt-1 w-5 h-5 accent-garden"
          />
          <span>
            <span className="font-semibold">{t("useAsDefault")}</span>
            <span className="block text-sm text-garden-muted">{t("defaultHint")}</span>
          </span>
        </label>
      </AddressForm>
    </section>
  );
};

const Parts = ({ parts, sep }: { parts: string[]; sep: string }) => (
  <>
    {parts
      .filter(Boolean)
      .map((p, i) => (
        <span key={i}>
          {i > 0 && sep}
          <bdi>{p}</bdi>
        </span>
      ))}
  </>
);

const AddressCard = ({ entry, index, onEdit }: { entry: SavedAddress; index: number; onEdit: () => void }) => {
  const t = useTranslations("account.addresses");
  const locale = useLocale() as "en" | "ar";
  const book = useAddressBook();
  const toResult = useFailureText();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const a = entry.address;
  const sep = locale === "ar" ? "، " : ", ";
  const heading = t("cardTitle", { index });

  const act = async (p: Promise<AccountResult>) => {
    setError(null);
    const r = toResult(await p);
    if (!r.ok) setError(r.message ?? t("errors.unavailable"));
  };

  return (
    <article aria-label={heading} className="h-full bg-white rounded-3xl p-5 md:p-6 flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="flex items-center gap-2 font-display text-xl me-auto">
          <LuMapPin aria-hidden="true" className="text-garden" />
          {heading}
        </h2>
        {entry.isDefault && (
          <Badge tone="success">
            <LuStar aria-hidden="true" />
            {t("default")}
          </Badge>
        )}
      </div>
      <address className="not-italic flex-1 leading-relaxed">
        <span className="block font-semibold">
          <bdi>{[a.firstName, a.lastName].filter(Boolean).join(" ")}</bdi>
        </span>
        {/* Each part is isolated, so a Latin street in an Arabic page (or the
            reverse) keeps the page's reading order between the parts. */}
        <span className="block">
          <Parts parts={[a.address1, a.address2]} sep={sep} />
        </span>
        <span className="block">
          <Parts parts={[a.city, governorateName(a.state, locale), a.postcode]} sep={sep} />
        </span>
        <span className="block text-garden-muted">
          <bdi dir="ltr">{a.phone}</bdi>
        </span>
      </address>
      {error && (
        <p role="alert" className="p-3 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
          {error}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-line">
        {confirming ? (
          <>
            <span role="status" className="text-sm font-semibold me-auto">
              {t("confirmDelete")}
            </span>
            <Button variant="ghost" onClick={() => setConfirming(false)}>
              {t("cancel")}
            </Button>
            <Button variant="danger" disabled={book.busy} onClick={() => act(book.remove(entry.id))}>
              <LuTrash2 aria-hidden="true" />
              {t("delete")}
            </Button>
          </>
        ) : (
          <>
            <Button variant="ghost" className="-ms-3" onClick={onEdit}>
              <LuPencil aria-hidden="true" />
              {t("edit")}
            </Button>
            {!entry.isDefault && (
              <Button variant="ghost" disabled={book.busy} onClick={() => act(book.setDefault(entry.id))}>
                <LuStar aria-hidden="true" />
                {t("makeDefault")}
              </Button>
            )}
            <Button variant="ghost" className="text-[#b42318] ms-auto" onClick={() => setConfirming(true)}>
              <LuTrash2 aria-hidden="true" />
              {t("delete")}
            </Button>
          </>
        )}
      </div>
    </article>
  );
};

/** The customer's saved addresses; the default one is where checkout starts. */
const AddressBook = () => {
  const t = useTranslations("account.addresses");
  const book = useAddressBook();
  const [editing, setEditing] = useState<Editing>(null);

  if (book.loading) return <AccountLoading />;
  if (book.signedOut) return <AccountSignIn />;
  if (book.failed || !book.book) return <AccountUnavailable retry={book.retry} />;

  const { addresses, limit } = book.book;
  const full = addresses.length >= limit;

  if (editing) {
    return (
      <div className="max-w-3xl mx-auto">
        <EntryForm editing={editing} isOnly={addresses.length === 0 && editing.mode === "new"} onDone={() => setEditing(null)} />
      </div>
    );
  }

  const addButton = (
    <Button onClick={() => setEditing({ mode: "new" })}>
      <LuPlus aria-hidden="true" />
      {t("add")}
    </Button>
  );

  if (addresses.length === 0) {
    return <EmptyState icon={<LuMapPin />} title={t("empty")} text={t("emptyText")} action={addButton} />;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        {full ? <p className="text-garden-muted">{t("full", { limit })}</p> : addButton}
      </div>
      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {addresses.map((entry, i) => (
          <li key={entry.id}>
            <AddressCard entry={entry} index={i + 1} onEdit={() => setEditing({ mode: "edit", entry })} />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AddressBook;
