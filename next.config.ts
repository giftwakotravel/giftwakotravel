import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All photography is served from /public — no remote sources.
    localPatterns: [{ pathname: "/images/**" }],
  },
};

export default nextConfig;
