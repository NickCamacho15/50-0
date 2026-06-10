import type { Metadata } from 'next';
import SoccerGame from '@/components/SoccerGame';

export const metadata: Metadata = {
  title: '38–0 — Conquer the World Cup',
  description:
    'Spin random nation + decade combos and sign one World Cup legend per position. Build the perfect XI and survive a 38-match gauntlet ending at the World Cup final.',
  openGraph: {
    title: '38–0 — Conquer the World Cup',
    description:
      'Spin random nation + decade combos and Frankenstein the perfect XI from World Cup legends. Can you go 38–0 and lift the trophy?',
  },
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2222%22 fill=%22%230d1017%22/><text x=%2250%22 y=%2268%22 font-size=%2248%22 font-family=%22Arial Black%22 font-weight=%22900%22 fill=%22%2345d483%22 text-anchor=%22middle%22>38</text></svg>',
  },
};

export default function SoccerPage() {
  return <SoccerGame />;
}
