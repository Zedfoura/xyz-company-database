const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5002/:path*',
      },
    ];
  },
};

export default nextConfig;
