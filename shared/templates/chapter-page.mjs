import { renderSiteLayout } from './site-layout.mjs';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderChapterPage({ book, chapter, sections }) {
  return renderSiteLayout({
    title: `${chapter.title} - ${book.title}`,
    bodyClass: 'page-chapter',
    stylesheetPath: '../assets/site.css',
    body: `
      <nav class="breadcrumbs">
        <a href="../index.html">${escapeHtml(book.title)}</a>
        <span>${escapeHtml(chapter.title)}</span>
      </nav>
      <header class="page-hero">
        <p class="page-kicker">章节总览</p>
        <h1>${escapeHtml(chapter.title)}</h1>
        <p class="page-source">从这里进入本章每一节的学习页面。</p>
      </header>
      <main class="chapter-overview">
        <ol class="section-list">
          ${sections
            .map(
              (section) => `
                <li>
                  <a href="../sections/${escapeHtml(chapter.slug)}/${escapeHtml(section.slug)}.html">${escapeHtml(section.number)} ${escapeHtml(section.title)}</a>
                </li>
              `,
            )
            .join('')}
        </ol>
      </main>
    `,
  });
}
