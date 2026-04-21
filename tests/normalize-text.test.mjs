import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizeDocument, normalizePageText } from '../shared/scripts/lib/normalize-text.mjs';

const rawPage = `第一章 幂函数、指数函数和对数函数 1
第一章 幂函数、指数函数和对数函数
一 集合
1.1 集合
考察下面几组对象：
（1） 1, 2, 3, 4, 5;
（2） 与一个角的两边距离相等的所有的点；
集合的表示方法，常用的有列举法和描述法。
把集合中的元素一一列举出来，写在大括号内表示集合的方法，叫做列举法。`;

test('normalizePageText removes page headers and repairs paragraphs', () => {
  const normalized = normalizePageText(rawPage);

  assert.doesNotMatch(normalized, /^第一章 幂函数、指数函数和对数函数 1/m);
  assert.match(normalized, /^第一章 幂函数、指数函数和对数函数$/m);
  assert.match(normalized, /^1\.1 集合$/m);
  assert.match(normalized, /考察下面几组对象：/);
  assert.match(normalized, /集合的表示方法，常用的有列举法和描述法。/);
});

test('normalizeDocument preserves page cardinality', () => {
  const rawDoc = {
    pages: [
      { number: 1, text: '第一章 幂函数、指数函数和对数函数 1\n第一章 幂函数、指数函数和对数函数' },
      { number: 2, text: '获取本书源码：' },
    ],
  };

  const normalized = normalizeDocument(rawDoc);

  assert.equal(normalized.pages.length, 2);
  assert.equal(normalized.pages[0].number, 1);
  assert.equal(normalized.pages[1].number, 2);
  assert.equal(normalized.pages[1].text, '');
});
