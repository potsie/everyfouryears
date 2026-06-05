'use client';

import { useState } from 'react';
import type { NewsArticle } from '@/lib/espn/wc-fetchers';

/* ---------- icons ---------- */
function FeedIco() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="3" y="4" width="18" height="5" rx="1.5" stroke="currentColor" strokeWidth="2" />
      <rect x="3" y="13" width="11" height="2.4" rx="1.2" fill="currentColor" />
      <rect x="3" y="18" width="8" height="2.4" rx="1.2" fill="currentColor" />
    </svg>
  );
}
function GridIco() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="3.5" width="7.5" height="7.5" rx="1.6" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="3.5" width="7.5" height="7.5" rx="1.6" stroke="currentColor" strokeWidth="2" />
      <rect x="3.5" y="13" width="7.5" height="7.5" rx="1.6" stroke="currentColor" strokeWidth="2" />
      <rect x="13" y="13" width="7.5" height="7.5" rx="1.6" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
function ExtIco({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" style={style}>
      <path d="M14 4h6v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 4l-8.5 8.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function LockIco() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" fill="currentColor" />
      <path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" stroke="currentColor" strokeWidth="2.2" />
    </svg>
  );
}
function NewsIco() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
      <path d="M5 4h11a1 1 0 0 1 1 1v13a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2V5a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 8h6M8 12h6M8 16h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- relative time ---------- */
function timeAgo(iso: string): string {
  const mins = (Date.now() - new Date(iso).getTime()) / 60000;
  if (mins < 60) return `${Math.max(1, Math.round(mins))}m ago`;
  const h = mins / 60;
  if (h < 24) return `${Math.round(h)}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/* ---------- shared bits ---------- */
function PremiumBadge() {
  return (
    <span className="news-premium-badge">
      <LockIco /> ESPN+
    </span>
  );
}

function ArticlePhoto({ article, className }: { article: NewsArticle; className?: string }) {
  if (article.imageUrl) {
    return (
      <img
        src={article.imageUrl}
        alt={article.headline}
        className={className}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return <div className={`nshot ${className ?? ''}`} />;
}

/* ---------- FEED: lead / hero ---------- */
function LeadStory({ a }: { a: NewsArticle }) {
  return (
    <a className="news-lead" href={a.href} target="_blank" rel="noopener noreferrer">
      <div className="news-lead-photo">
        <ArticlePhoto article={a} className={a.imageUrl ? '' : 'on-dark'} />
      </div>
      <div className="news-lead-scrim" />
      <div className="news-lead-top">
        <span className="news-kicker on-dark">{a.section}</span>
        {a.premium && <PremiumBadge />}
      </div>
      <div className="news-lead-in">
        <span className="news-kicker on-dark" style={{ display: 'inline-block' }}>Top Story</span>
        <h2 className="news-lead-h">{a.headline}</h2>
        <p className="news-lead-d">{a.description}</p>
        <div className="news-lead-foot">
          <span style={{ color: 'rgba(255,255,255,.82)', fontWeight: 700 }}>{a.byline}</span>
          <span className="sep">·</span>
          <span className="tnum">{timeAgo(a.published)}</span>
          <span className="news-read-on">Read on ESPN <ExtIco /></span>
        </div>
      </div>
    </a>
  );
}

/* ---------- FEED: stacked row ---------- */
function FeedRow({ a }: { a: NewsArticle }) {
  return (
    <a className="news-frow" href={a.href} target="_blank" rel="noopener noreferrer">
      <div className="news-fr-thumb">
        <ArticlePhoto article={a} className="nshot" />
        {a.premium && <span className="news-premium-pin"><PremiumBadge /></span>}
      </div>
      <div className="news-fr-body">
        <span className="news-kicker">{a.section}</span>
        <h3 className="news-fr-h">{a.headline}</h3>
        <p className="news-fr-d">{a.description}</p>
        <div className="news-fr-meta">
          <div className="news-art-meta">
            <span className="by">{a.byline}</span>
            <span className="sep">·</span>
            <span className="tnum">{timeAgo(a.published)}</span>
          </div>
        </div>
      </div>
      <span className="news-extlink news-fr-ext" aria-label="Opens on ESPN.com"><ExtIco /></span>
    </a>
  );
}

/* ---------- FEED: right rail ---------- */
function MostRead({ items }: { items: NewsArticle[] }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <h3>Most read</h3>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--ink-3)' }}>Today</span>
      </div>
      {items.map((a, i) => (
        <a className="news-mini-row" href={a.href} target="_blank" rel="noopener noreferrer" key={a.id}>
          <span className="news-mr-num tnum">{i + 1}</span>
          <div>
            <div className="news-mr-h">{a.headline}</div>
            <div className="news-mr-meta">
              {a.premium && <span className="news-mr-lock"><LockIco /></span>}
              <span>{a.section}</span>
              <span className="sep">·</span>
              <span className="tnum">{timeAgo(a.published)}</span>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

function BracketCrossLink() {
  return (
    <a className="myteam" href="/bracket" style={{ textDecoration: 'none', display: 'block' }}>
      <div className="mt-h">Knockout Stage</div>
      <div style={{ fontFamily: 'var(--display)', fontWeight: 800, fontSize: 19, lineHeight: 1.15, letterSpacing: '-.01em' }}>
        Follow every bracket match
      </div>
      <div className="mt-next" style={{ borderTopColor: 'rgba(255,255,255,.14)' }}>
        <span>See full bracket</span>
        <span style={{ color: '#7ee2a8', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          Full bracket →
        </span>
      </div>
    </a>
  );
}

/* ---------- GRID: card ---------- */
function NewsCard({ a, feat }: { a: NewsArticle; feat?: boolean }) {
  return (
    <a className={`news-ncard${feat ? ' feat' : ''}`} href={a.href} target="_blank" rel="noopener noreferrer">
      <div className="news-nc-photo">
        <ArticlePhoto article={a} className="nshot" />
        {a.premium && <span className="news-premium-pin"><PremiumBadge /></span>}
      </div>
      <div className="news-nc-body">
        <span className="news-kicker">{a.section}</span>
        <h3 className="news-nc-h">{a.headline}</h3>
        <p className="news-nc-d">{a.description}</p>
        <div className="news-nc-foot">
          <div className="news-art-meta">
            <span className="by">{a.byline}</span>
            <span className="sep">·</span>
            <span className="tnum">{timeAgo(a.published)}</span>
          </div>
          <span className="news-extlink" aria-label="Opens on ESPN.com"><ExtIco /></span>
        </div>
      </div>
    </a>
  );
}

/* ---------- main ---------- */
export function NewsClient({ articles }: { articles: NewsArticle[] }) {
  const [view, setView] = useState<'Feed' | 'Grid'>(() => {
    try { return (localStorage.getItem('wc-news-view') as 'Feed' | 'Grid') || 'Feed'; } catch { return 'Feed'; }
  });

  function switchView(v: 'Feed' | 'Grid') {
    setView(v);
    try { localStorage.setItem('wc-news-view', v); } catch {}
  }

  const sorted = [...articles].sort(
    (a, b) => new Date(b.published).getTime() - new Date(a.published).getTime(),
  );
  const lead = sorted[0];
  const rest = sorted.slice(1);
  const mostRead = sorted.slice(0, 5);

  if (!lead) {
    return (
      <div style={{ padding: '60px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 14 }}>
        No articles available right now. Check back soon.
      </div>
    );
  }

  return (
    <>
      <div className="pagehead">
        <div className="eyebrow">2026 FIFA World Cup</div>
        <div className="news-head-row">
          <h1>News</h1>
          <div className="seg" role="tablist" aria-label="News layout">
            <button
              role="tab"
              aria-selected={view === 'Feed'}
              className={view === 'Feed' ? 'on' : ''}
              onClick={() => switchView('Feed')}
            >
              <FeedIco /> Feed
            </button>
            <button
              role="tab"
              aria-selected={view === 'Grid'}
              className={view === 'Grid' ? 'on' : ''}
              onClick={() => switchView('Grid')}
            >
              <GridIco /> Grid
            </button>
          </div>
        </div>
        <div className="sub">
          <span>Latest from the tournament</span>
          <span className="sep">·</span>
          <span>updated continuously · <strong>{articles.length} stories</strong></span>
        </div>
      </div>

      {view === 'Feed' ? (
        <div className="news-feed-cols">
          <div>
            <LeadStory a={lead} />
            <div className="news-feed-list">
              {rest.map(a => <FeedRow a={a} key={a.id} />)}
            </div>
          </div>
          <div className="news-rail">
            <MostRead items={mostRead} />
            <BracketCrossLink />
          </div>
        </div>
      ) : (
        <div className="news-grid-wall">
          <NewsCard a={lead} feat key={lead.id} />
          {rest.map(a => <NewsCard a={a} key={a.id} />)}
        </div>
      )}

      <div className="news-attrib">
        <NewsIco /> Headlines syndicated from ESPN · every article opens on ESPN.com
      </div>
    </>
  );
}
