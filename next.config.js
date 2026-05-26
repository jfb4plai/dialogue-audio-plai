/** @type {import('next').NextConfig} */
const nextConfig = {
  // pdfjs-dist uses dynamic workers that can't be bundled by Next.js
  serverExternalPackages: ['pdfjs-dist', 'pdf-parse'],
}
module.exports = nextConfig
