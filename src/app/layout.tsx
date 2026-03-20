import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ClerkProvider } from '@clerk/nextjs';
import { ConvexClientProvider } from '@/components/providers/ConvexClientProvider';
import { DataMigrationProvider } from '@/components/providers/DataMigrationProvider';

export const metadata: Metadata = {
  title: 'Rally — Fun Nights, Less Overthinking',
  description: 'Rally helps you turn "I don\'t know what to do" into a plan that actually sounds fun. Date nights, friend hangouts, spontaneous outings.',
  keywords: ['outing generator', 'date planner', 'things to do near me', 'adventure planner', 'route builder', 'hangout ideas'],
  openGraph: {
    title: 'Rally — Fun Nights, Less Overthinking',
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
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FCFBF8' },
    { media: '(prefers-color-scheme: dark)', color: '#1F2126' },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          {/* Flash-free theme sync — runs before first paint */}
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(){try{var t=localStorage.getItem('rally-theme');var d=window.matchMedia('(prefers-color-scheme:dark)').matches;if(t==='dark'||(!t&&d))document.documentElement.classList.add('dark')}catch(e){}})()`,
            }}
          />
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
