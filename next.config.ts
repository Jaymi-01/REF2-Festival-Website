import type { NextConfig } from "next";

/**
 * `STATIC_EXPORT=1 npm run build` produces a fully static, relatively-linked
 * bundle in ./out that can be hosted anywhere (including as an Artifact).
 * The normal build is unaffected.
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";


const nextConfig: NextConfig = {
  ...(isStaticExport
    ? {
        output: "export" as const,
        // its own build dir, so an export never fights a running dev server
        distDir: ".next-export",
        // relative, so the bundle works from any sub-path
        assetPrefix: "./",
        images: {
          // a custom loader, NOT `unoptimized` — unoptimized bypasses the
          // loader and emits root-absolute "/brand/..." paths
          loader: "custom" as const,
          loaderFile: "./image-loader.js",
        },
      }
    : {}),
  // keep the Next dev badge out of the hosted build
  devIndicators: false,
  /* config options here */
  ...(isStaticExport ? {} : { cacheComponents: true, partialPrefetching: true }),
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
