/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => ({
    fallback: [
      {
        source: "/api/:path*",
        // TODO: this is for local Docker development only
        destination: "http://app:8080/api/:path*"
      }
    ]
  }),
}

module.exports = nextConfig
