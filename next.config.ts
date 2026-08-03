import type { NextConfig } from "next";

// STATIC_EXPORT=1 produces a fully static build (used for single-file demos);
// normal builds keep Next.js image optimization.
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  ...(staticExport
    ? { output: "export" as const, images: { unoptimized: true } }
    : { images: { formats: ["image/webp" as const] } }),
};

export default nextConfig;
