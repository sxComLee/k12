import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

import { initLearningUi } from '../../shared/scripts/browser/learning-ui.js';

test('initLearningUi toggles helper disclosures and concept-map targets', () => {
  const dom = new JSDOM(`
    <button data-disclosure-trigger="answer-1">查看提示</button>
    <div hidden id="answer-1">提示内容</div>
    <button data-map-target="set-membership">集合与元素</button>
    <article data-map-panel="set-membership" hidden>高亮面板</article>
  `);

  initLearningUi(dom.window.document);

  dom.window.document.querySelector('[data-disclosure-trigger]').click();
  assert.equal(dom.window.document.getElementById('answer-1').hidden, false);
  assert.equal(
    dom.window.document.querySelector('[data-disclosure-trigger]').getAttribute('aria-expanded'),
    'true',
  );

  dom.window.document.querySelector('[data-map-target]').click();
  assert.equal(
    dom.window.document.querySelector('[data-map-panel="set-membership"]').hidden,
    false,
  );
  assert.equal(
    dom.window.document.querySelector('[data-map-target]').dataset.active,
    'true',
  );
});

test('initLearningUi is idempotent and supports element roots', () => {
  const dom = new JSDOM(`
    <section id="lesson-root">
      <button data-disclosure-trigger="answer-2">查看答案</button>
      <div hidden id="answer-2">答案内容</div>
    </section>
  `);
  const root = dom.window.document.getElementById('lesson-root');
  const button = root.querySelector('[data-disclosure-trigger]');
  const panel = dom.window.document.getElementById('answer-2');

  initLearningUi(root);
  initLearningUi(root);
  button.click();

  assert.equal(panel.hidden, false);
  assert.equal(button.getAttribute('aria-expanded'), 'true');
});
