/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => ({
    fallback: [
      {
        source: "/api/:path*",
        destination: "http://127.0.0.1:8080/api/:path*"
      }
    ]
  }),
}

module.exports = nextConfig
