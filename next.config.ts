import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  images: {
    // All photography is served from /public — no remote sources.
    localPatterns: [{ pathname: "/images/**" }],
  },
};

export default nextConfig;
