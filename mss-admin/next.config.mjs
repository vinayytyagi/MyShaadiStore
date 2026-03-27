/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    const userAppUrl = process.env.USER_APP_URL || "http://localhost:3000";

    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: userAppUrl },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'objectstorage.ap-mumbai-1.oraclecloud.com',
      },
    ],
  },
};

export default nextConfig;
