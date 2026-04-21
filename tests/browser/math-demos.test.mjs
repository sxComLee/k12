import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

import { sampleFunctionPoints, initMathDemos } from '../../shared/scripts/browser/math-demos.js';

test('sampleFunctionPoints generates ordered coordinate pairs', () => {
  const points = sampleFunctionPoints(2, { xMin: -1, xMax: 1, step: 1 });
  assert.deepEqual(points, [
    { x: -1, y: 0.5 },
    { x: 0, y: 1 },
    { x: 1, y: 2 },
  ]);
});

test('sampleFunctionPoints supports logarithmic curves', () => {
  const points = sampleFunctionPoints(2, {
    xMin: 0.5,
    xMax: 2,
    step: 0.5,
    curve: 'logarithmic',
  });

  assert.deepEqual(points, [
    { x: 0.5, y: -1 },
    { x: 1, y: 0 },
    { x: 1.5, y: 0.585 },
    { x: 2, y: 1 },
  ]);
});

test('initMathDemos renders the first demo title into the root node', () => {
  const dom = new JSDOM(
    `<div class="demo-root" data-demo-config='{"kind":"set-operations","title":"集合关系切换"}'></div>`,
  );

  initMathDemos(dom.window.document);

  assert.match(dom.window.document.body.textContent, /集合关系切换/);
});

test('initMathDemos skips malformed demos and renders logarithmic families', () => {
  const dom = new JSDOM(`
    <div class="demo-root" data-demo-config='not-json'></div>
    <div class="demo-root" data-demo-config='{"kind":"function-family","title":"对数函数底数变化","curve":"logarithmic","bases":[2],"xMin":0.5,"xMax":2,"step":0.5}'></div>
  `);

  initMathDemos(dom.window.document);

  assert.match(dom.window.document.body.textContent, /对数函数底数变化/);
  assert.match(dom.window.document.body.textContent, /"y": -1/);
  assert.match(dom.window.document.body.textContent, /"y": 1/);
});
