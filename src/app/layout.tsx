import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import { DataMigrationProvider } from '@/components/providers/DataMigrationProvider';

export const metadata: Metadata = {
  title: 'Rally — Turn Your Location Into an Adventure',
  description: 'Rally generates real-world mini-adventures based on your location, vibe, and budget. Pick a mood, get a route, live the story.',
  keywords: ['outing generator', 'date planner', 'things to do near me', 'adventure planner', 'route builder'],
  openGraph: {
    title: 'Rally — Your Instant Outing Generator',
    description: 'Pick a vibe. Get a route. Live the story.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0f',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" className="dark">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link
            href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="min-h-dvh antialiased">
          <ConvexClientProvider>
            <DataMigrationProvider>
              {children}
            </DataMigrationProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
