/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      "https://calsync-backend-nmxe.onrender.com",
    NEXT_PUBLIC_SOCKET_URL:
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      "https://calsync-backend-nmxe.onrender.com",
  },
  images: {
    domains: ["calsync-backend-nmxe.onrender.com"],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
