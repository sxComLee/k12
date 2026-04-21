import { renderSiteLayout } from './site-layout.mjs';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderBookPage({ book, chapters }) {
  return renderSiteLayout({
    title: book.title,
    bodyClass: 'page-book',
    stylesheetPath: 'assets/site.css',
    body: `
      <main class="book-home">
        <header class="page-hero">
          <p class="page-kicker">甲种本学习版样板</p>
          <h1>${escapeHtml(book.title)}</h1>
          <p class="page-source">以原文为准，辅助层仅服务理解。</p>
        </header>
        <section class="chapter-grid">
          ${chapters
            .map(
              (chapter) => `
                <article class="chapter-card">
                  <h2>${escapeHtml(chapter.number)}. ${escapeHtml(chapter.title)}</h2>
                  <a href="chapters/${escapeHtml(chapter.slug)}.html">进入本章</a>
                </article>
              `,
            )
            .join('')}
        </section>
      </main>
    `,
  });
}
