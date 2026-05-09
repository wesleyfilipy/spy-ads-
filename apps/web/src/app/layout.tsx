import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'AdSpy — Facebook Ads Intelligence Platform',
    template: '%s | AdSpy',
  },
  description:
    'Mine, track, and analyze Facebook Ads at scale. Detect scaled campaigns, find winning creatives, and spy on your competitors.',
  keywords: ['facebook ads spy', 'ad intelligence', 'adspy', 'facebook ads library'],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'AdSpy',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground">{children}</body>
    </html>
  );
}
