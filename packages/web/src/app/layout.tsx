import { Atkinson_Hyperlegible, Geist, Geist_Mono } from 'next/font/google'

import type { Metadata } from 'next'

import './globals.css'

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
})

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
})

const atkinsonHyperlegible = Atkinson_Hyperlegible({
    weight: ['400', '700'],
    subsets: ['latin'],
    variable: '--font-atkinson-hyperlegible',
    display: 'swap',
})

export const metadata: Metadata = {
    title: 'RepoView',
    description: 'RepoView: Guided repository exploration',
    icons: {
        icon: [
            { url: '/icon.png', sizes: '192x192', type: 'image/png' },
            { url: '/icon.png', sizes: '512x512', type: 'image/png' },
        ],
        apple: [{ url: '/apple-icon.png' }],
    },
}

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} ${atkinsonHyperlegible.variable} antialiased`}
            >
                {children}
            </body>
        </html>
    )
}
