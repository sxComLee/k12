import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSectionBlocks } from '../shared/scripts/lib/parse-section-blocks.mjs';

test('parseSectionBlocks preserves order, stable ids, and merged content', () => {
  const blocks = parseSectionBlocks({
    slug: 'section-1-1',
    title: '集合',
    text: `1.1 集合

考察下面几组对象：

我们说，每一组对象的全体形成一个集合（有时也简称集)。

把集合中的元素一一列举出来，写在大括号内表示集合的方法，叫做列举法。

例 1 写出集合 {a, b} 的所有子集及真子集。

解: 集合 {a, b} 的所有的子集是 ∅，{a}，{b}，{a, b}。

例 2 写出集合 {a} 的所有子集。

练 习

1. {大于 3 小于 11 的偶数}。`,
  });

  assert.equal(blocks.length, 6);
  assert.deepEqual(
    blocks.map((block) => block.id),
    [
      'section-1-1-block-1',
      'section-1-1-block-2',
      'section-1-1-block-3',
      'section-1-1-block-4',
      'section-1-1-block-5',
      'section-1-1-block-6',
    ],
  );
  assert.equal(blocks[0].type, 'section-intro');
  assert.equal(blocks[1].type, 'definition');
  assert.equal(blocks[2].type, 'definition');
  assert.equal(blocks[3].type, 'example');
  assert.match(blocks[3].content, /^例 1 写出集合 \{a, b\} 的所有子集及真子集。/);
  assert.match(blocks[3].content, /解: 集合 \{a, b\} 的所有的子集是/);
  assert.doesNotMatch(blocks[3].content, /^例 2/m);
  assert.equal(blocks[4].type, 'example');
  assert.match(blocks[4].content, /^例 2 写出集合 \{a\} 的所有子集。$/);
  assert.equal(blocks[5].type, 'exercise');
  assert.match(blocks[5].content, /^练 习/);
  assert.match(blocks[5].content, /1\. \{大于 3 小于 11 的偶数\}。$/);
});

test('parseSectionBlocks filters heading fallback when section.number is absent and title has regex characters', () => {
  const blocks = parseSectionBlocks({
    slug: 'section-1-3',
    title: '函数(a+b)',
    text: `1.3 函数(a+b)

设 y = a + b。

我们把这种对应关系叫做函数(a+b)。`,
  });

  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].type, 'section-intro');
  assert.equal(blocks[0].content, '设 y = a + b。');
  assert.equal(blocks[1].type, 'definition');
});

test('parseSectionBlocks merges exercise heading with first numbered prompt by prompt shape', () => {
  const blocks = parseSectionBlocks({
    slug: 'section-1-2',
    number: '1.2',
    title: '子集、交集、并集、补集',
    text: `1.2 子集、交集、并集、补集

练 习

1. 判断函数 y = x^2 的定义域。

2. 求集合 A，B 的交集。`,
  });

  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].type, 'exercise');
  assert.match(blocks[0].content, /^练 习/);
  assert.match(blocks[0].content, /1\. 判断函数 y = x\^2 的定义域。$/);
  assert.equal(blocks[1].type, 'property');
  assert.equal(blocks[1].content, '2. 求集合 A，B 的交集。');
});
