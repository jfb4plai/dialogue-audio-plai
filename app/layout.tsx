import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dialogue Audio — PLAI',
  description: 'Générateur de dialogues audio multivoix pour l\'enseignement',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 min-h-screen">{children}</body>
    </html>
  )
}
