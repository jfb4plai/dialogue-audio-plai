import type { Metadata } from 'next'
import Image from 'next/image'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dialogue Audio — PLAI',
  description: 'Générateur de dialogues audio multivoix pour l\'enseignement',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-gray-100 border-b border-gray-300 px-4 py-2 flex items-center">
          <Image src="/plai-logo.jpg" alt="PLAI" width={120} height={48} className="object-contain" priority />
        </header>
        {children}
      </body>
    </html>
  )
}
