import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Space Blog',
  description: 'An AI researcher\'s blog in the cosmos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
      </body>
    </html>
  )
}
