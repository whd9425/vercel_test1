import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "etest.hackers.local",
    "emtest.hackers.local",
    "test.hackers.local",
    "mtest.hackers.local",
  ],
};

export default nextConfig;
