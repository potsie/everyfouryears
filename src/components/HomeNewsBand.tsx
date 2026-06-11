import type { NewsItem } from '@/lib/news';

const STRIPE = 'repeating-linear-gradient(135deg, #e9edf4 0 9px, #e3e9f1 9px 18px)';

function timeAgo(iso: string): string {
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins < 60) return `${Math.max(1, Math.round(mins))}m ago`;
  const h = mins / 60;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

function NewsBandCard({ item }: { item: NewsItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block no-underline"
      style={{
        color: 'inherit',
        background: 'var(--surface)',
        border: '1px solid var(--line)',
        borderRadius: 'var(--r-md)',
        overflow: 'hidden',
      }}
    >
      <div style={{ aspectRatio: '16 / 9', background: STRIPE, position: 'relative' }}>
        {item.imageUrl && (
          <img
            src={item.imageUrl}
            alt={item.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}
      </div>
      <div style={{ padding: '11px 13px 13px' }}>
        <div
          className="font-display font-bold uppercase"
          style={{ fontSize: 10.5, letterSpacing: '.09em', color: 'var(--accent)' }}
        >
          {item.feedTitle}
        </div>
        <div
          className="line-clamp-2"
          style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.32, marginTop: 5 }}
        >
          {item.title}
        </div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--ink-3)', marginTop: 8 }}>
          {timeAgo(item.published)}
        </div>
      </div>
    </a>
  );
}

/** Full-width "Latest news" band for the homepage. Renders the merged feed's top items. */
export function HomeNewsBand({ items }: { items: NewsItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-[14px]">
        <h2
          className="font-display font-bold text-[19px] tracking-[-0.01em] m-0"
          style={{ color: 'var(--ink)' }}
        >
          Latest News
        </h2>
        <a
          href="/news"
          className="font-semibold text-[13px] no-underline whitespace-nowrap"
          style={{ color: 'var(--ink-2)' }}
        >
          More news →
        </a>
      </div>
      <div className="grid gap-[13px] grid-cols-1 min-[440px]:grid-cols-2 min-[760px]:grid-cols-3">
        {items.map(item => (
          <NewsBandCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
