import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Absolutely Butter',
  description: 'A/B testing for solo technical founders',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  )
}
