"use client";
import { useLocale, useTranslations } from "next-intl";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { Spinner } from "@nextui-org/react";
import TextField from "@/shared/ui/TextField";
import Button from "@/shared/ui/Button";

type ContactForm = { name: string; email: string; message: string };

const ComplaintForm = () => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ContactForm>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const t = useTranslations("contactPage");
  const locale = useLocale();

  const submitcomplaint = async (data: ContactForm) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, locale }),
      });
      if (!res.ok) throw new Error("Failed to submit");
      toast.success(t("form.sended"));
      reset();
    } catch {
      toast.error(t("form.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // The asterisks were decorative: an empty form was posted to /api/contact.
  const required = { required: t("form.required") };

  return (
    <section aria-labelledby="contact-form" className="bg-white rounded-3xl p-5 md:p-8 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 id="contact-form" className="font-display text-2xl md:text-[2rem] leading-tight">
          {t("form.title")}
        </h2>
        <p className="text-garden-muted">{t("form.subTitle")}</p>
      </div>

      <form
        noValidate
        onSubmit={handleSubmit((data) => {
          submitcomplaint(data);
        })}
        className="flex flex-col gap-4"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextField
            {...register("name", required)}
            autoComplete="name"
            label={t("form.labels.name")}
            placeholder={t("form.placeholders.name")}
            error={errors.name?.message}
          />
          <TextField
            {...register("email", {
              ...required,
              pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: t("form.invalidEmail") },
            })}
            type="email"
            autoComplete="email"
            label={t("form.labels.email")}
            placeholder={t("form.placeholders.email")}
            error={errors.email?.message}
          />
        </div>
        <TextField
          {...register("message", required)}
          multiline
          rows={6}
          label={t("form.labels.message")}
          placeholder={t("form.placeholders.message")}
          error={errors.message?.message}
        />
        <Button type="submit" size="lg" className="self-start" disabled={isSubmitting} aria-busy={isSubmitting}>
          {isSubmitting && <Spinner size="sm" color="current" />}
          {t("form.action")}
        </Button>
      </form>
    </section>
  );
};

export default ComplaintForm;
