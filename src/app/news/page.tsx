import './news.css';
import { Nav } from '@/components/Nav';
import { NewsClient } from './NewsClient';
import { fetchNews, type NewsArticle } from '@/lib/espn/wc-fetchers';

export const metadata = { title: 'News — 2026 FIFA World Cup' };
export const revalidate = 600;

export default async function NewsPage() {
  let articles: NewsArticle[] = [];
  try {
    articles = await fetchNews();
  } catch {
    // fall through to empty state
  }

  return (
    <>
      <Nav activePath="/news" />
      <div className="page">
        <NewsClient articles={articles} />
      </div>
    </>
  );
}
