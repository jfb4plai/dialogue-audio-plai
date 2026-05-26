/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // pdfjs-dist uses dynamic workers that can't be bundled by Next.js 14
    serverComponentsExternalPackages: ['pdfjs-dist', 'pdf-parse'],
  },
}
module.exports = nextConfig
