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
      <body className="bg-jfb-subtil min-h-screen">
        <header className="bg-white border-b border-jfb-bordure px-6 py-3 flex items-center justify-between">
          <Image src="/plai-logo.jpg" alt="PLAI" width={160} height={64} className="object-contain" priority />
          <AuthWidget />
        </header>
        {children}
      </body>
    </html>
  )
}
