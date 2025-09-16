import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from '@/components/providers'
import { Navigation } from '@/components/layout/navigation'

// Initialize services (including cron scheduler)
if (typeof window === 'undefined') {
  import('@/lib/startup')
}

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Naly - AI-Powered Financial Intelligence',
  description: 'Transform complex market data into clear, explanatory narratives and actionable, probabilistic forecasts.',
  keywords: 'financial intelligence, market analysis, AI predictions, stock analysis, investment insights',
  authors: [{ name: 'Naly Team' }],
  creator: 'Naly',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://naly.ai',
    title: 'Naly - AI-Powered Financial Intelligence',
    description: 'Transform complex market data into clear, explanatory narratives and actionable, probabilistic forecasts.',
    siteName: 'Naly',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Naly - AI-Powered Financial Intelligence',
    description: 'Transform complex market data into clear, explanatory narratives and actionable, probabilistic forecasts.',
    creator: '@naly_ai',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen bg-background font-sans antialiased">
            <Navigation />
            <main className="relative flex min-h-screen flex-col">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}