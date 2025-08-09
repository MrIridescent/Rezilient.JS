import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'REZILIENT.js Next.js App',
  description: 'Production-ready application with revolutionary sustainability features',
  keywords: ['rezilient', 'sustainability', 'carbon-aware', 'offline-first', 'accessibility'],
  authors: [{ name: 'REZILIENT.js Team' }],
  openGraph: {
    title: 'REZILIENT.js Next.js App',
    description: 'Revolutionary framework with carbon-aware computing and AI-bias detection',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#10b981" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.className} bg-gray-50 min-h-screen`}>
        <div id="root">
          {children}
        </div>
        
        {/* Accessibility announcements */}
        <div 
          id="announcements" 
          aria-live="polite" 
          aria-atomic="true" 
          className="sr-only"
        />
        
        {/* Carbon intensity indicator */}
        <div 
          id="carbon-indicator" 
          className="fixed bottom-4 right-4 bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg text-sm"
          role="status"
          aria-label="Carbon intensity status"
        >
          🌱 Low Carbon
        </div>
      </body>
    </html>
  );
}
