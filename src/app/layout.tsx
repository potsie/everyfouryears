import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import { MyTeamProvider } from '@/contexts/my-team-context';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'everyfouryears.futbol — 2026 FIFA World Cup',
    template: '%s | everyfouryears.futbol',
  },
  description:
    'Live scores, schedules, group standings, brackets, and stats for the 2026 FIFA Men\'s World Cup.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={archivo.variable}
        style={{ fontFamily: 'var(--font-archivo), system-ui, sans-serif' }}
      >
        <MyTeamProvider>{children}</MyTeamProvider>
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
