import type { NextConfig } from "next";

const staticLearnerAssetCache = "private, max-age=86400, stale-while-revalidate=604800";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/lms/pfp/[file]": ["./private/lms/pfp/**/*"],
  },
  async headers() {
    return [
      {
        source: "/lms/pfp/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: staticLearnerAssetCache,
          },
        ],
      },
    ];
  },
};

export default nextConfig;
