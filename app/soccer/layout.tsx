import type { Viewport } from 'next';
import { Fraunces, Hanken_Grotesk, Spline_Sans_Mono } from 'next/font/google';
import './soccer.css';

// 38-0 has its own identity: matchday-programme print, not fight-night slate.
const fraunces = Fraunces({
  subsets: ['latin'],
  variable: '--sc-font-display',
  axes: ['opsz', 'SOFT', 'WONK'],
});
const hanken = Hanken_Grotesk({
  subsets: ['latin'],
  variable: '--sc-font-sans',
});
const splineMono = Spline_Sans_Mono({
  subsets: ['latin'],
  variable: '--sc-font-mono',
});

export const viewport: Viewport = {
  themeColor: '#f3efe4',
};

export default function SoccerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`sc-shell ${fraunces.variable} ${hanken.variable} ${splineMono.variable}`}>
      <div className="sc-pitch" aria-hidden="true" />
      {children}
    </div>
  );
}
