import './globals.css'
import type { Metadata } from 'next'
import { Poppins } from 'next/font/google'
import '../styles.css'
import Footer from './components/Footer'

// Initialize Poppins font
const poppins = Poppins({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-poppins',
})

export const metadata: Metadata = {
  title: 'Leave Management System',
  description: 'Manage your leaves efficiently',
  generator: 'v0.dev',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans min-h-screen flex flex-col`}>
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}
