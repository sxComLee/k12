import test from 'node:test';
import assert from 'node:assert/strict';

import { buildOutline } from '../shared/scripts/lib/parse-outline.mjs';

test('buildOutline preserves book metadata and ignores non-outline content', () => {
  const outline = buildOutline({
    bookTitle: '代数第一册（甲种本）',
    pages: [
      {
        pageNumber: 1,
        text: `前言

这部分不是目录结构。`,
      },
      {
        pageNumber: 5,
        text: `第十一章 幂函数、指数函数和对数函数

一 集合

1.1 集合`,
      },
      {
        pageNumber: 7,
        text: `1.2 子集、交集、并集、补集`,
      },
      {
        pageNumber: 15,
        text: `二 映射与函数

1.3 映射`,
      },
    ],
  });

  assert.equal(outline.bookTitle, '代数第一册（甲种本）');
  assert.equal(outline.chapters.length, 1);
  assert.equal(outline.chapters[0].slug, 'chapter-11');
  assert.equal(outline.chapters[0].title, '幂函数、指数函数和对数函数');
  assert.equal(outline.chapters[0].startPage, 5);
  assert.equal(outline.chapters[0].units[0].title, '集合');
  assert.equal(outline.chapters[0].units[0].startPage, 5);
  assert.equal(outline.chapters[0].sections[0].slug, 'section-1-1');
  assert.equal(outline.chapters[0].sections[0].startPage, 5);
  assert.equal(outline.chapters[0].sections[1].slug, 'section-1-2');
  assert.equal(outline.chapters[0].sections[2].unitSlug, 'unit-2');
});

test('buildOutline allows section starts before any current unit', () => {
  const outline = buildOutline({
    bookTitle: '代数第一册（甲种本）',
    pages: [
      {
        pageNumber: 20,
        text: `第十二章 函数图像

1.1 函数图像的基本概念`,
      },
    ],
  });

  assert.equal(outline.chapters.length, 1);
  assert.equal(outline.chapters[0].slug, 'chapter-12');
  assert.equal(outline.chapters[0].sections[0].unitSlug, null);
});
