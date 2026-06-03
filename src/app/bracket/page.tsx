import { Nav } from '@/components/Nav';
import { BracketClient } from './BracketClient';

export const metadata = { title: 'Knockout Bracket — 2026 FIFA World Cup' };

export default function BracketPage() {
  return (
    <>
      <Nav activePath="/bracket" />
      <div className="page">
        <BracketClient />
      </div>
    </>
  );
}
