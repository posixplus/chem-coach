import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Revision sheets are read from content/revise at request time; make sure Vercel bundles the folder.
  outputFileTracingIncludes: {
    "/revise": ["./content/revise/**/*"],
    "/revise/[slug]": ["./content/revise/**/*"],
    "/study": ["./content/revise/**/*"],
  },
};

export default nextConfig;
