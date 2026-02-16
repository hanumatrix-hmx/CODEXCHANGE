import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@codexchange/db"],
    reactStrictMode: true,
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**.supabase.co",
            },
        ],
    },
};

export default nextConfig;
