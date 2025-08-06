import type { Metadata } from 'next'
import './styles.css'
import ThemeProvider from '@/components/theme-provider'
import { GoogleTagManager, GoogleTagManagerNoScript } from '@/services/gtm'
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
      <head>
        <GoogleTagManager />
      </head>
      <body className={`${fonts} antialiased`}>
        <GoogleTagManagerNoScript />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
