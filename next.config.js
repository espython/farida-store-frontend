const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin();

// Media host (Strapi uploads today, Woo later). Only this host may be
// optimized by next/image; a bad value must not break the build.
const imagePatterns = [];
try {
  const { protocol, hostname, port } = new URL(
    process.env.NEXT_PUBLIC_HOST || ""
  );
  imagePatterns.push({
    protocol: protocol.replace(":", ""),
    hostname,
    ...(port && { port }),
  });
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: imagePatterns },
};

module.exports = withNextIntl(nextConfig);
