/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow production checks without overwriting a running development build.
  distDir: process.env.PASSMINT_BUILD_DIR ?? ".next",
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/dashboard", destination: "/events", permanent: true },
      { source: "/dashboard/:path*", destination: "/:path*", permanent: true },
    ];
  },
  async rewrites() {
    return [
      { source: "/api/:path*", destination: "http://127.0.0.1:3000/:path*" },
    ];
  },
};

export default nextConfig;
