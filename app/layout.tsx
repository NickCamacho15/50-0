import type { Metadata } from 'next';
import { Bebas_Neue, Inter } from 'next/font/google';
import './globals.css';

const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-bebas' });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: '50–0 — Build the Undefeated',
  description:
    'Spin the wheel. Steal one trait per spin from MMA legends. Build the perfect fighter and run the table to 50–0.',
  openGraph: {
    title: '50–0 — Build the Undefeated',
    description:
      'Spin random division + era combos and Frankenstein the perfect fighter from MMA legends. Can you go 50–0?',
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🥊</text></svg>',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${bebas.variable} ${inter.variable}`}>
        <div className="bg-cage" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
