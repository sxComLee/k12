import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { buildBookPaths, buildDaishu1 } from '../shared/scripts/build-daishu-1.mjs';

test('buildBookPaths returns stable workspace paths for daishu-1', () => {
  const paths = buildBookPaths('/repo');
  assert.equal(paths.slug, 'daishu-1');
  assert.equal(paths.siteRoot, '/repo/books/daishu-1/site');
});

test('buildDaishu1 generates the sample site for chapter 1', async () => {
  await buildDaishu1(process.cwd());

  const chapterPath = resolve(process.cwd(), 'books/daishu-1/site/chapters/chapter-1.html');
  const sectionPath = resolve(
    process.cwd(),
    'books/daishu-1/site/sections/chapter-1/section-1-1.html',
  );

  assert.equal(existsSync(chapterPath), true);
  assert.equal(existsSync(sectionPath), true);
  assert.match(readFileSync(sectionPath, 'utf8'), /1\.1 集合/);
  assert.match(readFileSync(sectionPath, 'utf8'), /学习导航/);
  assert.match(readFileSync(sectionPath, 'utf8'), /\.\.\/\.\.\/assets\/learning-ui\.js/);
  assert.match(readFileSync(sectionPath, 'utf8'), /\.\.\/\.\.\/assets\/math-demos\.js/);
  assert.doesNotMatch(readFileSync(sectionPath, 'utf8'), /第一章 幂函数、指数函数和对数函数/);
  assert.doesNotMatch(readFileSync(sectionPath, 'utf8'), />一 集合</);
});
