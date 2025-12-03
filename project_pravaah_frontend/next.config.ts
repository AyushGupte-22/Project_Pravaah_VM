import type { NextConfig } from 'next'

const config: NextConfig = {
  // Add this images block to whitelist the domain
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.icons8.com',
      },
    ],
  },
}

export default config