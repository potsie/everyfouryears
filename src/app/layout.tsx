import type { Metadata } from 'next';
import { Archivo } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
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
        {children}
      </body>
    </html>
  );
}
