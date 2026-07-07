import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/lms/pfp/[file]": ["./private/lms/pfp/**/*"],
  },
};

export default nextConfig;
