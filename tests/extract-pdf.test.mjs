import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const repoRoot = process.cwd();
const outPath = resolve(repoRoot, '_sandbox/daishu-1/debug/extract-test.json');

test('extract-pdf writes JSON with page numbers and text', () => {
  rmSync(outPath, { force: true });
  mkdirSync(dirname(outPath), { recursive: true });

  execFileSync(
    'swift',
    [
      'shared/scripts/extract-pdf.swift',
      '_sandbox/high_school_jiazhongben/代数第一册(甲种本).pdf',
      outPath,
    ],
    { cwd: repoRoot, stdio: 'inherit' },
  );

  const doc = JSON.parse(readFileSync(outPath, 'utf8'));
  assert.equal(doc.bookTitle, '代数第一册（甲种本）');
  assert.ok(doc.pageCount > 100);
  assert.equal(doc.pages.length, doc.pageCount);
  assert.equal(doc.pages[0].pageNumber, 1);
  assert.match(doc.pages[1].text, /说明/);
});
