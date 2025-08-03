/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://192.168.1.24:8000/api/v1/:path*',
      },
    ];
  },
}

module.exports = nextConfig 