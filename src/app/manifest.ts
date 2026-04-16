import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Apotek Ulebi POS',
    short_name: 'UlebiPOS',
    description: 'Sistem Kasir Apotek Offline-Ready',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/next.svg', // Placeholder, user should replace with real icon
        sizes: '192x192',
        type: 'image/svg+xml',
      },
      {
        src: '/next.svg',
        sizes: '512x512',
        type: 'image/svg+xml',
      },
    ],
  }
}
