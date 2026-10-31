"use client";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useLocale } from "next-intl";

/** The one toast outlet for the app; colours come from the --toastify-* variables in globals.css. */
const Toaster = () => {
  const locale = useLocale();
  return <ToastContainer position="top-center" rtl={locale === "ar"} autoClose={4000} newestOnTop />;
};

export default Toaster;
