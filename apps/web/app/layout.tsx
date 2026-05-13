import type { Metadata } from 'next';
import { Space_Grotesk, DM_Sans } from 'next/font/google';
import './globals.css';
import { SessionProvider } from '@/context/SessionContext';
import { AIChatProvider } from '@/context/AIChatContext';
import { UnitProvider } from '@/context/UnitContext';
import { Navbar } from '@/components/Navbar';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import AppSkyBackground from '@/components/weather/AppSkyBackground';
import AIChatSidebar from '@/components/AIChatSidebarDynamic';

const display = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-display',
});
const body = DM_Sans({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  icons: {
    icon: '/app-logo.ico',
  },
  title: 'Mausam',
  description: 'Track weather across multiple cities',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body
        className="min-h-screen text-[var(--text-primary)] font-body antialiased"
        style={{ background: 'var(--bg-primary)', backgroundAttachment: 'fixed' }}
      >
        <AppSkyBackground />
        <SessionProvider>
          <UnitProvider>
            <AIChatProvider>
              <Navbar />
              <main>
                <ErrorBoundary>{children}</ErrorBoundary>
              </main>
              <AIChatSidebar />
            </AIChatProvider>
          </UnitProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
