import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    transpilePackages: ["@codexchange/db"],
    reactStrictMode: true,
    serverActions: {
        bodySizeLimit: "4mb",
    },
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
