"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Spinner } from "@nextui-org/react";
import { LuPencil } from "react-icons/lu";
import { toast } from "react-toastify";
import Button from "@/shared/ui/Button";
import TextField from "@/shared/ui/TextField";
import { fullName, validateProfile, type Profile, type ProfileInput } from "../domain/Profile";
import { useProfile } from "../application/useAccount";
import { AccountLoading, AccountSignIn, AccountUnavailable } from "./AccountStates";

const ProfileForm = ({ profile, onDone }: { profile: Profile; onDone: () => void }) => {
  const t = useTranslations("account.profile");
  const { save, saving } = useProfile();
  const {
    register,
    handleSubmit,
    getValues,
    setError,
    formState: { errors },
  } = useForm<ProfileInput>({ defaultValues: { firstName: profile.firstName, lastName: profile.lastName } });

  const rule = (field: keyof ProfileInput) => (value: string) => {
    const code = validateProfile({ ...getValues(), [field]: value })[field];
    return code ? t(`errors.${code}`) : true;
  };

  const submit = handleSubmit(async (input) => {
    const r = await save(input);
    if (r.ok) {
      toast.success(t("saved"));
      onDone();
      return;
    }
    for (const [field, code] of Object.entries(r.failure.fields)) {
      if (code === "required" || code === "too_long") setError(field as keyof ProfileInput, { message: t(`errors.${code}`) });
    }
    if (r.failure.code !== "invalid") setError("root", { message: t("failed") });
  });

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-4 pt-6 border-t border-line">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <TextField {...register("firstName", { validate: rule("firstName") })} autoComplete="given-name" label={t("firstName")} error={errors.firstName?.message} />
        <TextField {...register("lastName", { validate: rule("lastName") })} autoComplete="family-name" label={t("lastName")} error={errors.lastName?.message} />
      </div>
      {errors.root && (
        <p role="alert" className="p-4 rounded-2xl bg-[#fde8e6] text-[#b42318] text-sm">
          {errors.root.message}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving} aria-busy={saving}>
          {saving && <Spinner size="sm" color="current" />}
          {t("save")}
        </Button>
        <Button variant="ghost" onClick={onDone}>
          {t("cancel")}
        </Button>
      </div>
    </form>
  );
};

/** The customer's name and sign-in email, with the name editable in place. */
const ProfileCard = () => {
  const t = useTranslations("account.profile");
  const p = useProfile();
  const [editing, setEditing] = useState(false);

  if (p.loading) return <AccountLoading />;
  if (p.signedOut) return <AccountSignIn />;
  if (p.failed || !p.profile) return <AccountUnavailable retry={p.retry} />;

  const { profile } = p;
  const name = fullName(profile) || profile.email;
  const initials = (profile.firstName[0] ?? profile.email[0] ?? "") + (profile.lastName[0] ?? "");

  return (
    <section aria-labelledby="profile-name" className="max-w-3xl mx-auto bg-white rounded-3xl p-5 md:p-8 flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-4">
        <span
          aria-hidden="true"
          className="w-16 h-16 md:w-20 md:h-20 shrink-0 grid place-items-center rounded-full bg-garden text-cream font-display text-2xl md:text-3xl uppercase"
        >
          {initials}
        </span>
        <div className="flex-1 min-w-[11rem]">
          <h2 id="profile-name" className="font-display text-2xl md:text-[1.75rem] leading-tight break-words">
            {name}
          </h2>
          <p className="text-garden-muted break-all">
            <bdi>{profile.email}</bdi>
          </p>
        </div>
        {!editing && (
          <Button variant="outline" onClick={() => setEditing(true)}>
            <LuPencil aria-hidden="true" />
            {t("edit")}
          </Button>
        )}
      </div>
      {editing ? (
        <ProfileForm profile={profile} onDone={() => setEditing(false)} />
      ) : (
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-6 border-t border-line">
          {[
            { label: t("firstName"), value: profile.firstName },
            { label: t("lastName"), value: profile.lastName },
            { label: t("email"), value: profile.email, hint: t("emailHint") },
          ].map((row) => (
            <div key={row.label} className="flex flex-col gap-0.5 min-w-0">
              <dt className="text-sm text-garden-muted">{row.label}</dt>
              <dd className="font-semibold break-words">
                <bdi>{row.value || "—"}</bdi>
                {row.hint && <span className="block text-sm font-normal text-garden-muted">{row.hint}</span>}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
};

export default ProfileCard;
