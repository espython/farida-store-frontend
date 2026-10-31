"use client";

// Last-resort boundary: replaces the whole document when the root/locale
// layout itself throws. It sits outside the next-intl provider and the
// stylesheet, so it shows both languages and uses inline styles (palette
// values copied from tailwind.config.js: cream, garden).
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
          background: "#f6f5ef",
          color: "#1e3a2b",
          textAlign: "center",
          padding: 20,
        }}
      >
        <div role="alert" style={{ maxWidth: 480, background: "#fff", borderRadius: 24, padding: "40px 24px" }}>
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
              background: "#1e3a2b",
              color: "#f6f5ef",
              border: 0,
              borderRadius: 999,
              minHeight: 44,
              padding: "12px 32px",
              fontWeight: 700,
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
