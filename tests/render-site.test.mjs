import test from 'node:test';
import assert from 'node:assert/strict';

import { renderBookPage } from '../shared/templates/book-page.mjs';
import { renderChapterPage } from '../shared/templates/chapter-page.mjs';
import { renderSectionPage } from '../shared/templates/section-page.mjs';

test('renderBookPage uses file-safe relative links from the site root', () => {
  const html = renderBookPage({
    book: { title: '代数第一册（甲种本）', slug: 'daishu-1' },
    chapters: [{ slug: 'chapter-1', number: 1, title: '幂函数、指数函数和对数函数' }],
  });

  assert.match(html, /href="assets\/site\.css"/);
  assert.match(html, /href="chapters\/chapter-1\.html"/);
  assert.doesNotMatch(html, /href="\/assets\/site\.css"/);
  assert.doesNotMatch(html, /href="\/chapters\/chapter-1\.html"/);
});

test('renderChapterPage uses file-safe relative links from chapter pages', () => {
  const html = renderChapterPage({
    book: { title: '代数第一册（甲种本）', slug: 'daishu-1' },
    chapter: { slug: 'chapter-1', title: '幂函数、指数函数和对数函数' },
    sections: [{ slug: 'section-1-1', number: '1.1', title: '集合' }],
  });

  assert.match(html, /href="\.\.\/assets\/site\.css"/);
  assert.match(html, /href="\.\.\/index\.html"/);
  assert.match(html, /href="\.\.\/sections\/chapter-1\/section-1-1\.html"/);
  assert.doesNotMatch(html, /href="\/index\.html"/);
  assert.doesNotMatch(html, /href="\/sections\/chapter-1\/section-1-1\.html"/);
});

test('renderSectionPage includes source and helper zones', () => {
  const html = renderSectionPage({
    book: { title: '代数第一册（甲种本）', slug: 'daishu-1' },
    chapter: { slug: 'chapter-1', title: '幂函数、指数函数和对数函数' },
    section: { slug: 'section-1-1', number: '1.1', title: '集合', pageRange: [5, 6] },
    blocks: [
      { id: 'b1', type: 'definition', content: '我们说，每一组对象的全体形成一个集合。' },
      { id: 'b2', type: 'exercise', content: '练 习\n1. {大于 3 小于 11 的偶数}。' },
    ],
    learningLayer: {
      learningGoals: ['理解集合与元素的关系'],
      keyPoints: ['集合', '列举法'],
      interactiveDemos: [{ kind: 'set-operations', title: "集合's 关系切换" }],
    },
  });

  assert.match(html, /class="breadcrumbs"/);
  assert.match(html, /原书第 5-6 页/);
  assert.match(html, /data-block-type="definition"/);
  assert.match(html, /学习导航/);
  assert.match(html, /集合&#39;s 关系切换/);
  assert.match(html, /data-demo-config='[^']*&#39;[^']*'/);
  assert.match(html, /href="\.\.\/\.\.\/assets\/site\.css"/);
  assert.match(html, /href="\.\.\/\.\.\/index\.html"/);
  assert.match(html, /href="\.\.\/\.\.\/chapters\/chapter-1\.html"/);
  assert.doesNotMatch(html, /href="\/assets\/site\.css"/);
  assert.doesNotMatch(html, /href="\/index\.html"/);
  assert.doesNotMatch(html, /href="\/chapters\/chapter-1\.html"/);
});
