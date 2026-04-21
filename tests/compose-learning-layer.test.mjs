import test from 'node:test';
import assert from 'node:assert/strict';

import { composeLearningLayer } from '../shared/scripts/lib/compose-learning-layer.mjs';

const section = {
  slug: 'section-1-1',
  number: '1.1',
  title: '集合',
};

const blocks = [
  { type: 'definition', content: '我们说，每一组对象的全体形成一个集合（有时也简称集)。' },
  { type: 'definition', content: '把集合中的元素一一列举出来，写在大括号内表示集合的方法，叫做列举法。' },
];

const overrides = {
  learningGoals: ['理解集合与元素的关系'],
  interactiveDemos: [{ kind: 'set-operations', title: '集合关系切换' }],
};

test('composeLearningLayer merges defaults with overrides', () => {
  const layer = composeLearningLayer(section, blocks, overrides);

  assert.deepEqual(layer.learningGoals, ['理解集合与元素的关系']);
  assert.equal(layer.keyPoints.length, 2);
  assert.equal(layer.interactiveDemos[0].kind, 'set-operations');
});
