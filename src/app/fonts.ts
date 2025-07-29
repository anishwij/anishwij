import { JetBrains_Mono, Mona_Sans, Source_Serif_4 } from 'next/font/google'

const monaSans = Mona_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
})

const jetBrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
})

const sourceSerif = Source_Serif_4({
  variable: '--font-serif',
  subsets: ['latin'],
})

export const fonts = `${monaSans.variable} ${jetBrainsMono.variable} ${sourceSerif.variable} font-sans`
