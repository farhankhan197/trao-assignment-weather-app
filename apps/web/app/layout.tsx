import type { Metadata } from 'next';
import { DM_Serif_Display, DM_Sans } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { AIChatProvider } from '@/context/AIChatContext';
import { Navbar } from '@/components/Navbar';
import { AIChatSidebar } from '@/components/AIChatSidebar';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const display = DM_Serif_Display({ subsets: ['latin'], weight: '400', variable: '--font-display' });
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
      <body className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] font-body antialiased">
        <AuthProvider>
          <AIChatProvider>
            <Navbar />
            <main>
              <ErrorBoundary>{children}</ErrorBoundary>
            </main>
            <AIChatSidebar />
          </AIChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}