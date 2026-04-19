import type { Metadata } from 'next'
import Image from 'next/image'
import AuthWidget from '@/components/AuthWidget'
import './globals.css'

export const metadata: Metadata = {
  title: 'Dialogue Audio — PLAI',
  description: 'Générateur de dialogues audio multivoix pour l\'enseignement',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 min-h-screen">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <Image src="/plai-logo.jpg" alt="PLAI" width={200} height={80} style={{ height: 'auto' }} className="object-contain" priority />
          <AuthWidget />
        </header>
        {children}
      </body>
    </html>
  )
}
