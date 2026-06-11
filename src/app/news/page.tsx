import './news.css';
import { Nav } from '@/components/Nav';
import { NewsClient } from './NewsClient';
import { getMergedNews, type NewsItem } from '@/lib/news';

export const metadata = { title: 'News — 2026 FIFA World Cup' };
export const revalidate = 600;

export default async function NewsPage() {
  let items: NewsItem[] = [];
  try {
    const feed = await getMergedNews();
    items = feed.items;
  } catch {
    // fall through to empty state
  }

  return (
    <>
      <Nav activePath="/news" />
      <div className="page">
        <NewsClient items={items} />
      </div>
    </>
  );
}
