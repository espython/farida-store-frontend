const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin();

// Media comes from WordPress uploads (product images, promotion banners), so
// next/image may optimize only the WooCommerce host. A bad value must not
// break the build.
const imagePatterns = [];
try {
  const { protocol, hostname, port } = new URL(process.env.WC_BASE_URL || "");
  imagePatterns.push({
    protocol: protocol.replace(":", ""),
    hostname,
    ...(port && { port }),
  });
} catch {}

/** @type {import('next').NextConfig} */
const nextConfig = {
  // A self-contained server (.next/standalone) for the Docker image (doc/deploy-coolify.md).
  output: "standalone",
  images: { remotePatterns: imagePatterns },
};

module.exports = withNextIntl(nextConfig);
