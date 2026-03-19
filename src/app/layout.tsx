import type { Metadata } from 'next';
import { Inter, JetBrains_Mono, Playfair_Display } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});

const playfairDisplay = Playfair_Display({
  subsets: ['latin'],
  weight: '900',
  variable: '--font-playfair-display',
});

export const metadata: Metadata = {
  title: 'PTE Writing Master',
  description: 'Master PTE topic sentences and essay writing with AI-powered feedback and templates.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} ${playfairDisplay.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
