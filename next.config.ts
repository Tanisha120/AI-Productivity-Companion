import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "579448337989-katg3qaurt76qsd36ct7f6ph9qa41aab.apps.googleusercontent.com" },
      { protocol: "https", hostname: "avatars.githubusercontent.com" },
    ],
  },
  experimental: {
    serverActions: { allowedOrigins: ["localhost:3000", "ai-productivity-companion-*.a.run.app"] },
  },
};

export default nextConfig;
