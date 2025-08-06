// app/layout.js
import { GoogleTagManager } from '@next/third-parties/google'
import type { Metadata } from 'next'
import './styles.css'
import CookieConsent from '@/components/cookie-consent'
import ThemeProvider from '@/components/theme-provider'
import { ConsentModeInit } from '@/services/gtm'
import { fonts } from './fonts'

export const metadata: Metadata = {
  title: 'Anishwij',
  description: 'Not a real site right now',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID!} />
      <body className={`${fonts} antialiased`}>
        <ConsentModeInit />
        <ThemeProvider>
          {children}
          <CookieConsent />
        </ThemeProvider>
      </body>
    </html>
  )
}
