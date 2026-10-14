"use client";

// Last-resort boundary: replaces the whole document when the root/locale
// layout itself throws. It sits outside the next-intl provider and the
// stylesheet, so it shows both languages and uses inline styles.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          color: "#161616",
          textAlign: "center",
          padding: 20,
        }}
      >
        <div role="alert" style={{ maxWidth: 480 }}>
          <h1 style={{ fontSize: 24, margin: "0 0 8px" }}>Something went wrong</h1>
          <p style={{ margin: "0 0 24px", opacity: 0.6 }}>
            An unexpected error occurred. Please try again.
          </p>
          <h2 dir="rtl" lang="ar" style={{ fontSize: 24, margin: "0 0 8px" }}>
            حدث خطأ ما
          </h2>
          <p dir="rtl" lang="ar" style={{ margin: "0 0 24px", opacity: 0.6 }}>
            حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
          </p>
          {error.digest && (
            <p style={{ fontSize: 12, opacity: 0.4 }}>Ref: {error.digest}</p>
          )}
          <button
            onClick={() => reset()}
            style={{
              background: "#161616",
              color: "#fff",
              border: 0,
              borderRadius: 4,
              padding: "12px 32px",
              fontSize: 16,
              cursor: "pointer",
            }}
          >
            Try again / حاول مرة أخرى
          </button>
        </div>
      </body>
    </html>
  );
}
