import type { Metadata, Viewport } from 'next';
import { Archivo, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  variable: '--font-archivo',
  axes: ['wdth'],
});
const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

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
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2222%22 fill=%22%230d1017%22/><text x=%2250%22 y=%2268%22 font-size=%2248%22 font-family=%22Arial Black%22 font-weight=%22900%22 fill=%22%23e7b43c%22 text-anchor=%22middle%22>50</text></svg>',
  },
};

export const viewport: Viewport = {
  themeColor: '#0d1017',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${archivo.variable} ${plexMono.variable}`}>
        <div className="bg-cage" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
