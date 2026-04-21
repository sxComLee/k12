# Daishu-1 HTML Learning Sample Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable sample pipeline that converts `代数第一册（甲种本）` from PDF into a structured HTML learning site with chapter/section navigation, source-faithful content blocks, and focused learning interactions.

**Architecture:** Use a macOS-only Swift `PDFKit` extractor for raw page text, then process the extracted JSON through small Node.js modules that normalize text, infer chapter/section boundaries, segment section blocks, compose learning-layer metadata, and render a static HTML site. Keep the output simple: generated content under `books/daishu-1`, reusable assets under `shared/`, and temporary extraction artifacts under `_sandbox/daishu-1`.

**Tech Stack:** Swift 6 + `PDFKit`, Node.js 20 ESM, vanilla HTML/CSS/JS, JSON, `node:test`, `jsdom`

---

> **Execution note:** This workspace is currently not a Git repository. If you want checkpoint commits, run `git init` before Task 1 and use the suggested commit commands. If you do not initialize Git, still complete every code and verification step; treat the commit steps as logical checkpoints.

## File Structure

- `package.json`
  Purpose: declare the Node ESM workspace, test runner, build scripts, and `jsdom` dependency.

- `.gitignore`
  Purpose: keep `node_modules`, generated site files, and `_sandbox` scratch outputs out of version control when Git is initialized.

- `shared/scripts/extract-pdf.swift`
  Purpose: extract PDF page text plus page metadata from the sample textbook using `PDFKit`.

- `shared/scripts/build-daishu-1.mjs`
  Purpose: orchestrate the full sample pipeline from extraction through rendering.

- `shared/scripts/lib/normalize-text.mjs`
  Purpose: strip headers/footers noise, repair wrapped lines, and prepare paragraphs for parsing.

- `shared/scripts/lib/parse-outline.mjs`
  Purpose: infer chapters, units, and section boundaries from normalized page text.

- `shared/scripts/lib/parse-section-blocks.mjs`
  Purpose: split section text into typed source blocks such as `definition`, `example`, `exercise`, and `summary`.

- `shared/scripts/lib/compose-learning-layer.mjs`
  Purpose: derive default learning goals and key points, then merge curated overrides for chapter 1.

- `shared/scripts/lib/render-site.mjs`
  Purpose: write the book landing page, chapter page, section pages, and shared browser assets.

- `shared/templates/site-layout.mjs`
  Purpose: shared page shell used by every generated page.

- `shared/templates/book-page.mjs`
  Purpose: render the textbook homepage.

- `shared/templates/chapter-page.mjs`
  Purpose: render the chapter overview with knowledge map entry points.

- `shared/templates/section-page.mjs`
  Purpose: render the main learning page for each section.

- `shared/styles/site.css`
  Purpose: define typography, layout, source/helper visual separation, and interactive affordances.

- `shared/scripts/browser/learning-ui.js`
  Purpose: power disclosures, answer reveals, and concept-map highlighting.

- `shared/scripts/browser/math-demos.js`
  Purpose: power set-operations and function-family demos for the sample chapter.

- `books/daishu-1/content/overrides/chapter-1.json`
  Purpose: hold curated helper-layer content for chapter 1 where automatic derivation is not enough.

- `_sandbox/daishu-1/raw/pages.json`
  Purpose: raw extracted page text from the PDF.

- `_sandbox/daishu-1/normalized/pages.json`
  Purpose: normalized pages after cleanup.

- `books/daishu-1/content/book.json`
  Purpose: structured book-level metadata and outline.

- `books/daishu-1/content/chapters/chapter-1.json`
  Purpose: structured chapter JSON with parsed section content for the sample chapter.

- `books/daishu-1/site/`
  Purpose: generated static HTML site output.

- `tests/build-daishu-1.test.mjs`
  Purpose: verify base path resolution and final end-to-end build behavior.

- `tests/extract-pdf.test.mjs`
  Purpose: verify the Swift extractor writes stable JSON.

- `tests/normalize-text.test.mjs`
  Purpose: verify textbook cleanup rules.

- `tests/parse-outline.test.mjs`
  Purpose: verify chapter/unit/section boundary detection.

- `tests/parse-section-blocks.test.mjs`
  Purpose: verify block typing and order preservation.

- `tests/compose-learning-layer.test.mjs`
  Purpose: verify derived helper content plus overrides merge.

- `tests/render-site.test.mjs`
  Purpose: verify generated section HTML contains source and helper zones.

- `tests/browser/learning-ui.test.mjs`
  Purpose: verify toggles and concept-map interactions with `jsdom`.

- `tests/browser/math-demos.test.mjs`
  Purpose: verify sample math demo calculations and DOM updates.

## Task 1: Bootstrap the Sample Workspace

**Files:**
- Create: `package.json`
- Create: `.gitignore`
- Create: `shared/scripts/build-daishu-1.mjs`
- Test: `tests/build-daishu-1.test.mjs`

- [ ] **Step 1: Write the failing path-resolution test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildBookPaths } from '../shared/scripts/build-daishu-1.mjs';

test('buildBookPaths returns stable workspace paths for daishu-1', () => {
  const paths = buildBookPaths('/repo');

  assert.equal(paths.slug, 'daishu-1');
  assert.equal(
    paths.pdfPath,
    '/repo/_sandbox/high_school_jiazhongben/代数第一册(甲种本).pdf',
  );
  assert.equal(paths.sandboxRoot, '/repo/_sandbox/daishu-1');
  assert.equal(paths.rawPath, '/repo/_sandbox/daishu-1/raw/pages.json');
  assert.equal(paths.normalizedPath, '/repo/_sandbox/daishu-1/normalized/pages.json');
  assert.equal(paths.contentRoot, '/repo/books/daishu-1/content');
  assert.equal(paths.siteRoot, '/repo/books/daishu-1/site');
});
```

- [ ] **Step 2: Run the test to verify the build entry file does not exist yet**

Run: `node --test tests/build-daishu-1.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND` for `shared/scripts/build-daishu-1.mjs`

- [ ] **Step 3: Write the minimal workspace scaffolding**

`package.json`

```json
{
  "name": "k12-daishu-html-learning",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test",
    "extract:daishu-1": "swift shared/scripts/extract-pdf.swift \"_sandbox/high_school_jiazhongben/代数第一册(甲种本).pdf\" \"_sandbox/daishu-1/raw/pages.json\"",
    "build:daishu-1": "node shared/scripts/build-daishu-1.mjs"
  },
  "devDependencies": {
    "jsdom": "^26.1.0"
  }
}
```

`.gitignore`

```gitignore
node_modules/
books/daishu-1/site/
_sandbox/daishu-1/
```

`shared/scripts/build-daishu-1.mjs`

```js
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

export function buildBookPaths(repoRoot = process.cwd()) {
  const root = resolve(repoRoot);

  return {
    root,
    slug: 'daishu-1',
    pdfPath: resolve(root, '_sandbox/high_school_jiazhongben/代数第一册(甲种本).pdf'),
    sandboxRoot: resolve(root, '_sandbox/daishu-1'),
    rawPath: resolve(root, '_sandbox/daishu-1/raw/pages.json'),
    normalizedPath: resolve(root, '_sandbox/daishu-1/normalized/pages.json'),
    contentRoot: resolve(root, 'books/daishu-1/content'),
    siteRoot: resolve(root, 'books/daishu-1/site'),
  };
}

export async function ensureBaseDirectories(paths) {
  await Promise.all([
    mkdir(resolve(paths.sandboxRoot, 'raw'), { recursive: true }),
    mkdir(resolve(paths.sandboxRoot, 'normalized'), { recursive: true }),
    mkdir(resolve(paths.contentRoot, 'chapters'), { recursive: true }),
    mkdir(resolve(paths.contentRoot, 'overrides'), { recursive: true }),
    mkdir(paths.siteRoot, { recursive: true }),
  ]);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const paths = buildBookPaths();
  await ensureBaseDirectories(paths);
  console.log(JSON.stringify(paths, null, 2));
}
```

- [ ] **Step 4: Install dependencies and run the test again**

Run:

```bash
npm install
node --test tests/build-daishu-1.test.mjs
```

Expected: PASS with one successful test

- [ ] **Step 5: Capture a checkpoint**

Run:

```bash
git add package.json .gitignore shared/scripts/build-daishu-1.mjs tests/build-daishu-1.test.mjs
git commit -m "chore: bootstrap daishu html sample workspace"
```

Expected: a checkpoint commit if Git is initialized

## Task 2: Extract Raw PDF Pages with Swift `PDFKit`

**Files:**
- Create: `shared/scripts/extract-pdf.swift`
- Test: `tests/extract-pdf.test.mjs`

- [ ] **Step 1: Write the failing extractor integration test**

```js
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
  assert.equal(doc.pages[0].pageNumber, 1);
  assert.match(doc.pages[1].text, /说明/);
});
```

- [ ] **Step 2: Run the test to verify the extractor does not exist yet**

Run: `node --test tests/extract-pdf.test.mjs`

Expected: FAIL because `shared/scripts/extract-pdf.swift` is missing

- [ ] **Step 3: Implement the Swift extractor**

```swift
import Foundation
import PDFKit

struct ExtractedPage: Codable {
    let pageNumber: Int
    let label: String?
    let text: String
}

struct ExtractedDocument: Codable {
    let sourcePDF: String
    let bookTitle: String
    let pageCount: Int
    let extractedAt: String
    let pages: [ExtractedPage]
}

let args = CommandLine.arguments
guard args.count == 3 else {
    fputs("Usage: swift shared/scripts/extract-pdf.swift <input-pdf> <output-json>\n", stderr)
    exit(1)
}

let inputURL = URL(fileURLWithPath: args[1])
let outputURL = URL(fileURLWithPath: args[2])

guard let document = PDFDocument(url: inputURL) else {
    fputs("Unable to open PDF at \(inputURL.path)\n", stderr)
    exit(1)
}

let title = "代数第一册（甲种本）"
let pages = (0..<document.pageCount).compactMap { index -> ExtractedPage? in
    guard let page = document.page(at: index) else { return nil }

    let rawText = (page.string ?? "")
        .replacingOccurrences(of: "\u{00A0}", with: " ")
        .replacingOccurrences(of: "\r\n", with: "\n")

    return ExtractedPage(
        pageNumber: index + 1,
        label: page.label,
        text: rawText
    )
}

let payload = ExtractedDocument(
    sourcePDF: inputURL.lastPathComponent,
    bookTitle: title,
    pageCount: document.pageCount,
    extractedAt: ISO8601DateFormatter().string(from: Date()),
    pages: pages
)

try FileManager.default.createDirectory(
    at: outputURL.deletingLastPathComponent(),
    withIntermediateDirectories: true
)

let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys, .withoutEscapingSlashes]
let data = try encoder.encode(payload)
try data.write(to: outputURL)

print("Extracted \(document.pageCount) pages to \(outputURL.path)")
```

- [ ] **Step 4: Run the test to verify extraction works**

Run:

```bash
node --test tests/extract-pdf.test.mjs
npm run extract:daishu-1
```

Expected:
- The test passes
- `_sandbox/daishu-1/raw/pages.json` exists and contains more than 100 pages

- [ ] **Step 5: Capture a checkpoint**

Run:

```bash
git add shared/scripts/extract-pdf.swift tests/extract-pdf.test.mjs
git commit -m "feat: extract daishu pdf pages with pdfkit"
```

Expected: a checkpoint commit if Git is initialized

## Task 3: Normalize Raw Text for Parsing

**Files:**
- Create: `shared/scripts/lib/normalize-text.mjs`
- Test: `tests/normalize-text.test.mjs`

- [ ] **Step 1: Write the failing normalization test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { normalizePageText } from '../shared/scripts/lib/normalize-text.mjs';

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
```

- [ ] **Step 2: Run the test to verify the normalizer does not exist yet**

Run: `node --test tests/normalize-text.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: Implement the normalizer**

```js
const HEADER_PATTERNS = [
  /^(说明|目录)\s+[ivxlcdm]+$/iu,
  /^第[一二三四五六七八九十]+章.+\s+\d+$/,
];

const FOOTNOTE_PATTERNS = [
  /^\d+\s+有的书上用冒号/,
  /^获取本书源码：/,
  /^\d+\s+备用网址：/,
];

const BLOCK_START = /^(第[一二三四五六七八九十]+章|[一二三四五六七八九十]+\s+\S+|\d+\.\d+\s+\S+|例\s*\d+|解[:：]?|练\s*习|习题\s*[一二三四五六七八九十]+|小\s*结|复习参考题)/;

export function normalizePageText(rawText) {
  const lines = rawText
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((line) => !HEADER_PATTERNS.some((pattern) => pattern.test(line)))
    .filter((line) => !FOOTNOTE_PATTERNS.some((pattern) => pattern.test(line)));

  const paragraphs = [];

  for (const line of lines) {
    const previous = paragraphs.at(-1);
    const shouldStartNewParagraph =
      paragraphs.length === 0 ||
      BLOCK_START.test(line) ||
      (previous && BLOCK_START.test(previous)) ||
      /[。！？；：]$/.test(previous);

    if (shouldStartNewParagraph) {
      paragraphs.push(line);
      continue;
    }

    paragraphs[paragraphs.length - 1] += line;
  }

  return paragraphs.join('\n\n');
}

export function normalizeDocument(rawDoc) {
  return {
    ...rawDoc,
    pages: rawDoc.pages.map((page) => ({ ...page, text: normalizePageText(page.text) })),
  };
}
```

- [ ] **Step 4: Run the test to verify normalization passes**

Run:

```bash
node --test tests/normalize-text.test.mjs
```

Expected: PASS with one successful test

- [ ] **Step 5: Capture a checkpoint**

Run:

```bash
git add shared/scripts/lib/normalize-text.mjs tests/normalize-text.test.mjs
git commit -m "feat: normalize extracted textbook pages"
```

Expected: a checkpoint commit if Git is initialized

## Task 4: Infer Chapter, Unit, and Section Boundaries

**Files:**
- Create: `shared/scripts/lib/parse-outline.mjs`
- Test: `tests/parse-outline.test.mjs`

- [ ] **Step 1: Write the failing outline parser test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { buildOutline } from '../shared/scripts/lib/parse-outline.mjs';

const pages = [
  {
    pageNumber: 5,
    text: `第一章 幂函数、指数函数和对数函数

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
];

test('buildOutline identifies chapter, unit, and section starts', () => {
  const outline = buildOutline({
    bookTitle: '代数第一册（甲种本）',
    pages,
  });

  assert.equal(outline.chapters.length, 1);
  assert.equal(outline.chapters[0].slug, 'chapter-1');
  assert.equal(outline.chapters[0].title, '幂函数、指数函数和对数函数');
  assert.equal(outline.chapters[0].units[0].title, '集合');
  assert.equal(outline.chapters[0].sections[0].slug, 'section-1-1');
  assert.equal(outline.chapters[0].sections[0].startPage, 5);
  assert.equal(outline.chapters[0].sections[1].slug, 'section-1-2');
  assert.equal(outline.chapters[0].sections[2].unitSlug, 'unit-2');
});
```

- [ ] **Step 2: Run the test to verify the parser does not exist yet**

Run: `node --test tests/parse-outline.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: Implement the outline parser**

```js
const CHAPTER_PATTERN = /^第([一二三四五六七八九十]+)章\s+(.+)$/;
const UNIT_PATTERN = /^([一二三四五六七八九十]+)\s+(.+)$/;
const SECTION_PATTERN = /^(\d+)\.(\d+)\s+(.+)$/;

function toChapterNumber(chineseNumber) {
  return ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'].indexOf(chineseNumber) + 1;
}

export function buildOutline(rawDoc) {
  const outline = {
    bookTitle: rawDoc.bookTitle,
    chapters: [],
  };

  let currentChapter = null;
  let currentUnit = null;

  for (const page of rawDoc.pages) {
    const lines = page.text.split(/\n{2,}/).map((line) => line.trim()).filter(Boolean);

    for (const line of lines) {
      const chapterMatch = line.match(CHAPTER_PATTERN);
      if (chapterMatch) {
        const chapterNumber = toChapterNumber(chapterMatch[1]);
        currentChapter = {
          slug: `chapter-${chapterNumber}`,
          number: chapterNumber,
          title: chapterMatch[2],
          startPage: page.pageNumber,
          units: [],
          sections: [],
        };
        outline.chapters.push(currentChapter);
        currentUnit = null;
        continue;
      }

      if (!currentChapter) {
        continue;
      }

      const unitMatch = line.match(UNIT_PATTERN);
      if (unitMatch && !line.startsWith('第')) {
        currentUnit = {
          slug: `unit-${currentChapter.units.length + 1}`,
          label: unitMatch[1],
          title: unitMatch[2],
          startPage: page.pageNumber,
        };
        currentChapter.units.push(currentUnit);
        continue;
      }

      const sectionMatch = line.match(SECTION_PATTERN);
      if (sectionMatch) {
        currentChapter.sections.push({
          slug: `section-${sectionMatch[1]}-${sectionMatch[2]}`,
          number: `${sectionMatch[1]}.${sectionMatch[2]}`,
          title: sectionMatch[3],
          startPage: page.pageNumber,
          unitSlug: currentUnit?.slug ?? null,
        });
      }
    }
  }

  return outline;
}
```

- [ ] **Step 4: Run the test to verify outline inference works**

Run:

```bash
node --test tests/parse-outline.test.mjs
```

Expected: PASS with one successful test

- [ ] **Step 5: Capture a checkpoint**

Run:

```bash
git add shared/scripts/lib/parse-outline.mjs tests/parse-outline.test.mjs
git commit -m "feat: infer textbook outline from normalized pages"
```

Expected: a checkpoint commit if Git is initialized

## Task 5: Parse Section Blocks and Compose the Learning Layer

**Files:**
- Create: `shared/scripts/lib/parse-section-blocks.mjs`
- Create: `shared/scripts/lib/compose-learning-layer.mjs`
- Create: `books/daishu-1/content/overrides/chapter-1.json`
- Test: `tests/parse-section-blocks.test.mjs`
- Test: `tests/compose-learning-layer.test.mjs`

- [ ] **Step 1: Write the failing block parser test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { parseSectionBlocks } from '../shared/scripts/lib/parse-section-blocks.mjs';

const section = {
  slug: 'section-1-1',
  title: '集合',
  text: `1.1 集合

考察下面几组对象：

我们说，每一组对象的全体形成一个集合（有时也简称集)。

把集合中的元素一一列举出来，写在大括号内表示集合的方法，叫做列举法。

例 1 写出集合 {a, b} 的所有子集及真子集。

解: 集合 {a, b} 的所有的子集是 ∅，{a}，{b}，{a, b}。

练 习

1. {大于 3 小于 11 的偶数}。`,
};

test('parseSectionBlocks preserves order and assigns block types', () => {
  const blocks = parseSectionBlocks(section);

  assert.equal(blocks[0].type, 'section-intro');
  assert.equal(blocks[1].type, 'definition');
  assert.equal(blocks[2].type, 'definition');
  assert.equal(blocks[3].type, 'example');
  assert.equal(blocks[4].type, 'exercise');
});
```

- [ ] **Step 2: Write the failing learning-layer composition test**

```js
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
```

- [ ] **Step 3: Run the tests to confirm both modules are missing**

Run:

```bash
node --test tests/parse-section-blocks.test.mjs
node --test tests/compose-learning-layer.test.mjs
```

Expected: both commands FAIL with `ERR_MODULE_NOT_FOUND`

- [ ] **Step 4: Implement block parsing, helper composition, and chapter overrides**

`shared/scripts/lib/parse-section-blocks.mjs`

```js
function classifyParagraph(text) {
  if (/^例\s*\d+/.test(text) || /^解[:：]?/.test(text)) {
    return 'example';
  }

  if (/^(练\s*习|习题\s*[一二三四五六七八九十]+|复习参考题)/.test(text)) {
    return 'exercise';
  }

  if (/^小\s*结/.test(text)) {
    return 'summary';
  }

  if (/^\d+\s+有的书上用冒号/.test(text)) {
    return 'note';
  }

  if (/(叫做|记作|简称|称为)/.test(text)) {
    return 'definition';
  }

  if (/(性质|关系式|公式|函数|交集|并集|补集|子集)/.test(text)) {
    return 'property';
  }

  return 'section-intro';
}

export function parseSectionBlocks(section) {
  const paragraphs = section.text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => !paragraph.startsWith(section.number));

  return paragraphs.map((content, index) => ({
    id: `${section.slug}-block-${index + 1}`,
    type: classifyParagraph(content),
    content,
  }));
}
```

`shared/scripts/lib/compose-learning-layer.mjs`

```js
function deriveKeyPoints(blocks) {
  return blocks
    .filter((block) => block.type === 'definition' || block.type === 'property')
    .slice(0, 4)
    .map((block) => block.content.slice(0, 28));
}

export function composeLearningLayer(section, blocks, overrides = {}) {
  return {
    learningGoals:
      overrides.learningGoals ??
      [
        `理解 ${section.title} 的核心概念`,
        `提取本节的关键记号、结论与例题结构`,
        `通过练习验证本节的判断与表达方式`,
      ],
    keyPoints: overrides.keyPoints ?? deriveKeyPoints(blocks),
    conceptMap: overrides.conceptMap ?? null,
    interactiveDemos: overrides.interactiveDemos ?? [],
    commonMistakes: overrides.commonMistakes ?? [],
  };
}
```

`books/daishu-1/content/overrides/chapter-1.json`

```json
{
  "section-1-1": {
    "learningGoals": [
      "理解集合、元素以及“属于/不属于”的关系",
      "掌握列举法和描述法的区别",
      "能把对象组织成规范的集合表示"
    ],
    "interactiveDemos": [
      {
        "kind": "set-operations",
        "title": "集合关系切换",
        "modes": ["members", "intersection", "union", "complement"]
      }
    ]
  },
  "section-1-2": {
    "interactiveDemos": [
      {
        "kind": "set-operations",
        "title": "子集、交集、并集、补集联动图",
        "modes": ["subset", "intersection", "union", "complement"]
      }
    ]
  },
  "section-1-12": {
    "interactiveDemos": [
      {
        "kind": "function-family",
        "title": "指数函数底数变化",
        "bases": [0.5, 2, 10],
        "xMin": -3,
        "xMax": 3,
        "step": 0.25
      }
    ]
  },
  "section-1-13": {
    "interactiveDemos": [
      {
        "kind": "function-family",
        "title": "对数函数底数变化",
        "bases": [0.5, 2, 10],
        "xMin": 0.25,
        "xMax": 4,
        "step": 0.25
      }
    ]
  }
}
```

- [ ] **Step 5: Run the tests to verify parsing and helper composition work**

Run:

```bash
node --test tests/parse-section-blocks.test.mjs
node --test tests/compose-learning-layer.test.mjs
```

Expected: both tests PASS

- [ ] **Step 6: Capture a checkpoint**

Run:

```bash
git add shared/scripts/lib/parse-section-blocks.mjs shared/scripts/lib/compose-learning-layer.mjs books/daishu-1/content/overrides/chapter-1.json tests/parse-section-blocks.test.mjs tests/compose-learning-layer.test.mjs
git commit -m "feat: parse section blocks and compose learning layer"
```

Expected: a checkpoint commit if Git is initialized

## Task 6: Render Book, Chapter, and Section HTML

**Files:**
- Create: `shared/templates/site-layout.mjs`
- Create: `shared/templates/book-page.mjs`
- Create: `shared/templates/chapter-page.mjs`
- Create: `shared/templates/section-page.mjs`
- Create: `shared/styles/site.css`
- Create: `shared/scripts/lib/render-site.mjs`
- Test: `tests/render-site.test.mjs`

- [ ] **Step 1: Write the failing section render test**

```js
import test from 'node:test';
import assert from 'node:assert/strict';

import { renderSectionPage } from '../shared/templates/section-page.mjs';

test('renderSectionPage includes source and helper zones', () => {
  const html = renderSectionPage({
    book: { title: '代数第一册（甲种本）', slug: 'daishu-1' },
    chapter: { slug: 'chapter-1', title: '幂函数、指数函数和对数函数' },
    section: { slug: 'section-1-1', number: '1.1', title: '集合', pageRange: [5, 6] },
    blocks: [
      { id: 'b1', type: 'definition', content: '我们说，每一组对象的全体形成一个集合。' },
      { id: 'b2', type: 'exercise', content: '练 习\\n1. {大于 3 小于 11 的偶数}。' }
    ],
    learningLayer: {
      learningGoals: ['理解集合与元素的关系'],
      keyPoints: ['集合', '列举法'],
      interactiveDemos: [{ kind: 'set-operations', title: '集合关系切换' }]
    }
  });

  assert.match(html, /class="breadcrumbs"/);
  assert.match(html, /原书第 5-6 页/);
  assert.match(html, /data-block-type="definition"/);
  assert.match(html, /学习导航/);
  assert.match(html, /集合关系切换/);
});
```

- [ ] **Step 2: Run the test to confirm the rendering templates are missing**

Run: `node --test tests/render-site.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: Implement the templates, renderer, and base stylesheet**

`shared/templates/site-layout.mjs`

```js
export function renderSiteLayout({ title, bodyClass, body, scripts = [] }) {
  const scriptTags = scripts
    .map((scriptPath) => `<script type="module" src="${scriptPath}"></script>`)
    .join('\n');

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <link rel="stylesheet" href="/assets/site.css" />
  </head>
  <body class="${bodyClass}">
    ${body}
    ${scriptTags}
  </body>
</html>`;
}
```

`shared/templates/book-page.mjs`

```js
import { renderSiteLayout } from './site-layout.mjs';

export function renderBookPage({ book, chapters }) {
  return renderSiteLayout({
    title: book.title,
    bodyClass: 'page-book',
    body: `
      <main class="book-home">
        <header class="page-hero">
          <p class="page-kicker">甲种本学习版样板</p>
          <h1>${book.title}</h1>
          <p class="page-source">以原文为准，辅助层仅服务理解。</p>
        </header>
        <section class="chapter-grid">
          ${chapters
            .map(
              (chapter) => `
                <article class="chapter-card">
                  <h2>${chapter.number}. ${chapter.title}</h2>
                  <a href="/chapters/${chapter.slug}.html">进入本章</a>
                </article>
              `,
            )
            .join('')}
        </section>
      </main>
    `,
  });
}
```

`shared/templates/chapter-page.mjs`

```js
import { renderSiteLayout } from './site-layout.mjs';

export function renderChapterPage({ book, chapter, sections }) {
  return renderSiteLayout({
    title: `${chapter.title} - ${book.title}`,
    bodyClass: 'page-chapter',
    body: `
      <nav class="breadcrumbs">
        <a href="/index.html">${book.title}</a>
        <span>${chapter.title}</span>
      </nav>
      <header class="page-hero">
        <p class="page-kicker">章节总览</p>
        <h1>${chapter.title}</h1>
        <p class="page-source">从这里进入本章每一节的学习页面。</p>
      </header>
      <main class="chapter-overview">
        <ol class="section-list">
          ${sections
            .map(
              (section) => `
                <li>
                  <a href="/sections/${chapter.slug}/${section.slug}.html">${section.number} ${section.title}</a>
                </li>
              `,
            )
            .join('')}
        </ol>
      </main>
    `,
  });
}
```

`shared/templates/section-page.mjs`

```js
import { renderSiteLayout } from './site-layout.mjs';

function renderBlocks(blocks) {
  return blocks
    .map(
      (block) => `
        <article class="source-block" data-block-type="${block.type}" id="${block.id}">
          <div class="block-label">${block.type}</div>
          <div class="block-content">${block.content}</div>
        </article>
      `,
    )
    .join('\n');
}

export function renderSectionPage({ book, chapter, section, blocks, learningLayer }) {
  const goals = learningLayer.learningGoals.map((goal) => `<li>${goal}</li>`).join('');
  const keyPoints = learningLayer.keyPoints.map((point) => `<li>${point}</li>`).join('');
  const demos = learningLayer.interactiveDemos
    .map(
      (demo) => `
        <section class="demo-card" data-demo-kind="${demo.kind}">
          <h3>${demo.title}</h3>
          <div class="demo-root" data-demo-config='${JSON.stringify(demo)}'></div>
        </section>
      `,
    )
    .join('');

  return renderSiteLayout({
    title: `${section.number} ${section.title} - ${book.title}`,
    bodyClass: 'page-section',
    scripts: ['/assets/learning-ui.js', '/assets/math-demos.js'],
    body: `
      <nav class="breadcrumbs">
        <a href="/index.html">${book.title}</a>
        <a href="/chapters/${chapter.slug}.html">${chapter.title}</a>
        <span>${section.number} ${section.title}</span>
      </nav>
      <header class="page-hero">
        <p class="page-kicker">${chapter.title}</p>
        <h1>${section.number} ${section.title}</h1>
        <p class="page-source">原书第 ${section.pageRange[0]}-${section.pageRange[1]} 页</p>
      </header>
      <main class="section-layout">
        <section class="source-column">
          <h2>原文主线</h2>
          ${renderBlocks(blocks)}
        </section>
        <aside class="support-column">
          <section class="helper-card">
            <h2>学习导航</h2>
            <ul>${goals}</ul>
          </section>
          <section class="helper-card">
            <h2>关键点</h2>
            <ul>${keyPoints}</ul>
          </section>
          ${demos}
        </aside>
      </main>
    `,
  });
}
```

`shared/styles/site.css`

```css
:root {
  --paper: #f6f1e6;
  --paper-deep: #ebe2cf;
  --ink: #1f1a14;
  --muted: #6d6255;
  --accent: #8a3b12;
  --line: rgba(31, 26, 20, 0.14);
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
  color: var(--ink);
  background:
    radial-gradient(circle at top left, rgba(138, 59, 18, 0.08), transparent 30%),
    linear-gradient(180deg, #fbf8f2, var(--paper));
  font-family: "Source Han Serif SC", "Noto Serif SC", serif;
}

.breadcrumbs,
.page-hero,
.section-layout {
  width: min(1200px, calc(100vw - 2rem));
  margin-inline: auto;
}

.section-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.7fr) minmax(300px, 0.9fr);
  gap: 2rem;
  align-items: start;
  padding-bottom: 4rem;
}

.source-block,
.helper-card,
.demo-card {
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid var(--line);
  border-radius: 20px;
  padding: 1.2rem 1.3rem;
  backdrop-filter: blur(8px);
}

.source-block[data-block-type="definition"] {
  border-left: 5px solid var(--accent);
}

.source-block[data-block-type="exercise"] {
  border-left: 5px solid #294f7c;
}

@media (max-width: 900px) {
  .section-layout {
    grid-template-columns: 1fr;
  }
}
```

`shared/scripts/lib/render-site.mjs`

```js
import { cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import { renderBookPage } from '../../templates/book-page.mjs';
import { renderChapterPage } from '../../templates/chapter-page.mjs';
import { renderSectionPage } from '../../templates/section-page.mjs';

export async function writeBookPage({ siteRoot, book, chapters }) {
  await writeFile(
    resolve(siteRoot, 'index.html'),
    renderBookPage({ book, chapters }),
    'utf8',
  );
}

export async function writeChapterPage({ siteRoot, book, chapter, sections }) {
  const outPath = resolve(siteRoot, 'chapters', `${chapter.slug}.html`);
  await mkdir(resolve(siteRoot, 'chapters'), { recursive: true });
  await writeFile(outPath, renderChapterPage({ book, chapter, sections }), 'utf8');
}

export async function writeSectionPage({ siteRoot, book, chapter, section }) {
  const outPath = resolve(siteRoot, 'sections', chapter.slug, `${section.slug}.html`);
  await mkdir(resolve(siteRoot, 'sections', chapter.slug), { recursive: true });
  await writeFile(outPath, renderSectionPage({ book, chapter, ...section }), 'utf8');
}

export async function copySharedAssets({ root, siteRoot }) {
  await mkdir(resolve(siteRoot, 'assets'), { recursive: true });
  await cp(resolve(root, 'shared/styles/site.css'), resolve(siteRoot, 'assets/site.css'));
  await cp(resolve(root, 'shared/scripts/browser/learning-ui.js'), resolve(siteRoot, 'assets/learning-ui.js'));
  await cp(resolve(root, 'shared/scripts/browser/math-demos.js'), resolve(siteRoot, 'assets/math-demos.js'));
}
```

- [ ] **Step 4: Run the render test to verify the HTML skeleton works**

Run:

```bash
node --test tests/render-site.test.mjs
```

Expected: PASS with one successful test

- [ ] **Step 5: Capture a checkpoint**

Run:

```bash
git add shared/templates/site-layout.mjs shared/templates/book-page.mjs shared/templates/chapter-page.mjs shared/templates/section-page.mjs shared/styles/site.css shared/scripts/lib/render-site.mjs tests/render-site.test.mjs
git commit -m "feat: render book chapter and section pages"
```

Expected: a checkpoint commit if Git is initialized

## Task 7: Add Structural Learning Interactions

**Files:**
- Create: `shared/scripts/browser/learning-ui.js`
- Test: `tests/browser/learning-ui.test.mjs`

- [ ] **Step 1: Write the failing `jsdom` interaction test**

```js
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

  dom.window.document.querySelector('[data-map-target]').click();
  assert.equal(
    dom.window.document.querySelector('[data-map-panel="set-membership"]').hidden,
    false,
  );
});
```

- [ ] **Step 2: Run the test to verify the browser module is missing**

Run: `node --test tests/browser/learning-ui.test.mjs`

Expected: FAIL with `ERR_MODULE_NOT_FOUND`

- [ ] **Step 3: Implement disclosure and concept-map interactions**

```js
export function initLearningUi(root = document) {
  root.querySelectorAll('[data-disclosure-trigger]').forEach((button) => {
    button.addEventListener('click', () => {
      const panel = root.getElementById(button.dataset.disclosureTrigger);
      panel.hidden = !panel.hidden;
      button.setAttribute('aria-expanded', String(!panel.hidden));
    });
  });

  root.querySelectorAll('[data-map-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.mapTarget;

      root.querySelectorAll('[data-map-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.mapPanel !== target;
      });

      root.querySelectorAll('[data-map-target]').forEach((candidate) => {
        candidate.dataset.active = String(candidate === button);
      });
    });
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initLearningUi(document);
  });
}
```

- [ ] **Step 4: Run the browser interaction test**

Run:

```bash
node --test tests/browser/learning-ui.test.mjs
```

Expected: PASS with one successful test

- [ ] **Step 5: Capture a checkpoint**

Run:

```bash
git add shared/scripts/browser/learning-ui.js tests/browser/learning-ui.test.mjs
git commit -m "feat: add helper disclosures and concept map interactions"
```

Expected: a checkpoint commit if Git is initialized

## Task 8: Add Sample Math Demos and Wire the End-to-End Build

**Files:**
- Create: `shared/scripts/browser/math-demos.js`
- Modify: `shared/scripts/build-daishu-1.mjs`
- Test: `tests/browser/math-demos.test.mjs`
- Test: `tests/build-daishu-1.test.mjs`

- [ ] **Step 1: Write the failing math-demo test**

```js
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

test('initMathDemos renders the first demo title into the root node', () => {
  const dom = new JSDOM(`<div class="demo-root" data-demo-config='{"kind":"set-operations","title":"集合关系切换"}'></div>`);
  initMathDemos(dom.window.document);
  assert.match(dom.window.document.body.textContent, /集合关系切换/);
});
```

- [ ] **Step 2: Extend the build test into an end-to-end smoke test and run both tests**

Update `tests/build-daishu-1.test.mjs` to this:

```js
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
});
```

Run:

```bash
node --test tests/browser/math-demos.test.mjs
node --test tests/build-daishu-1.test.mjs
```

Expected: both commands FAIL because the math demo module and full build pipeline are still incomplete

- [ ] **Step 3: Implement math demos and the final orchestrated build**

`shared/scripts/browser/math-demos.js`

```js
export function sampleFunctionPoints(base, { xMin, xMax, step }) {
  const points = [];
  for (let x = xMin; x <= xMax + Number.EPSILON; x += step) {
    points.push({
      x: Number(x.toFixed(4)),
      y: Number((base ** x).toFixed(4)),
    });
  }
  return points;
}

function renderSetDemo(root, config) {
  root.innerHTML = `
    <div class="demo-heading">${config.title}</div>
    <div class="demo-copy">切换模式后观察集合关系如何变化。</div>
    <div class="demo-mode-list">
      ${config.modes.map((mode) => `<button type="button">${mode}</button>`).join('')}
    </div>
  `;
}

function renderFunctionDemo(root, config) {
  const pointsByBase = config.bases.map((base) => ({
    base,
    points: sampleFunctionPoints(base, config),
  }));

  root.innerHTML = `
    <div class="demo-heading">${config.title}</div>
    <pre>${JSON.stringify(pointsByBase, null, 2)}</pre>
  `;
}

export function initMathDemos(root = document) {
  root.querySelectorAll('.demo-root').forEach((node) => {
    const config = JSON.parse(node.dataset.demoConfig);

    if (config.kind === 'set-operations') {
      renderSetDemo(node, config);
      return;
    }

    if (config.kind === 'function-family') {
      renderFunctionDemo(node, config);
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initMathDemos(document);
  });
}
```

Replace `shared/scripts/build-daishu-1.mjs` with this orchestrated version:

```js
import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import { normalizeDocument } from './lib/normalize-text.mjs';
import { buildOutline } from './lib/parse-outline.mjs';
import { parseSectionBlocks } from './lib/parse-section-blocks.mjs';
import { composeLearningLayer } from './lib/compose-learning-layer.mjs';
import {
  copySharedAssets,
  writeBookPage,
  writeChapterPage,
  writeSectionPage,
} from './lib/render-site.mjs';

const execFileAsync = promisify(execFile);

export function buildBookPaths(repoRoot = process.cwd()) {
  const root = resolve(repoRoot);

  return {
    root,
    slug: 'daishu-1',
    bookTitle: '代数第一册（甲种本）',
    pdfPath: resolve(root, '_sandbox/high_school_jiazhongben/代数第一册(甲种本).pdf'),
    sandboxRoot: resolve(root, '_sandbox/daishu-1'),
    rawPath: resolve(root, '_sandbox/daishu-1/raw/pages.json'),
    normalizedPath: resolve(root, '_sandbox/daishu-1/normalized/pages.json'),
    contentRoot: resolve(root, 'books/daishu-1/content'),
    overridesPath: resolve(root, 'books/daishu-1/content/overrides/chapter-1.json'),
    siteRoot: resolve(root, 'books/daishu-1/site'),
  };
}

export async function ensureBaseDirectories(paths) {
  await Promise.all([
    mkdir(resolve(paths.sandboxRoot, 'raw'), { recursive: true }),
    mkdir(resolve(paths.sandboxRoot, 'normalized'), { recursive: true }),
    mkdir(resolve(paths.contentRoot, 'chapters'), { recursive: true }),
    mkdir(resolve(paths.contentRoot, 'overrides'), { recursive: true }),
    mkdir(resolve(paths.siteRoot, 'chapters'), { recursive: true }),
  ]);
}

function pageRangeForSection(chapter, index, fallbackEndPage) {
  const start = chapter.sections[index].startPage;
  const end = chapter.sections[index + 1]?.startPage
    ? chapter.sections[index + 1].startPage - 1
    : fallbackEndPage;
  return [start, end];
}

function collectSectionText(pages, pageRange) {
  const [start, end] = pageRange;
  return pages
    .filter((page) => page.pageNumber >= start && page.pageNumber <= end)
    .map((page) => page.text)
    .join('\n\n');
}

export async function buildDaishu1(repoRoot = process.cwd()) {
  const paths = buildBookPaths(repoRoot);
  await ensureBaseDirectories(paths);

  if (!existsSync(paths.rawPath)) {
    await execFileAsync(
      'swift',
      ['shared/scripts/extract-pdf.swift', paths.pdfPath, paths.rawPath],
      { cwd: paths.root },
    );
  }

  const rawDoc = JSON.parse(await readFile(paths.rawPath, 'utf8'));
  const normalizedDoc = normalizeDocument(rawDoc);
  await writeFile(paths.normalizedPath, JSON.stringify(normalizedDoc, null, 2));

  const outline = buildOutline(normalizedDoc);
  const chapter = outline.chapters[0];
  const overrides = JSON.parse(await readFile(paths.overridesPath, 'utf8'));
  const chapterEndPage =
    outline.chapters[1]?.startPage ? outline.chapters[1].startPage - 1 : normalizedDoc.pages.at(-1).pageNumber;

  const sections = chapter.sections.map((section, index) => {
    const pageRange = pageRangeForSection(chapter, index, chapterEndPage);
    const text = collectSectionText(normalizedDoc.pages, pageRange);
    const withText = { ...section, pageRange, text };
    const blocks = parseSectionBlocks(withText);
    const learningLayer = composeLearningLayer(withText, blocks, overrides[section.slug]);
    return { ...withText, blocks, learningLayer };
  });

  await writeFile(
    resolve(paths.contentRoot, 'book.json'),
    JSON.stringify(
      {
        title: outline.bookTitle,
        slug: paths.slug,
        chapters: outline.chapters.map(({ slug, number, title, startPage }) => ({
          slug,
          number,
          title,
          startPage,
        })),
      },
      null,
      2,
    ),
  );

  await writeFile(
    resolve(paths.contentRoot, 'chapters', `${chapter.slug}.json`),
    JSON.stringify({ ...chapter, sections }, null, 2),
  );

  await copySharedAssets(paths);

  for (const section of sections) {
    await writeSectionPage({
      siteRoot: paths.siteRoot,
      book: { title: outline.bookTitle, slug: paths.slug },
      chapter,
      section,
    });
  }

  await writeChapterPage({
    siteRoot: paths.siteRoot,
    book: { title: outline.bookTitle, slug: paths.slug },
    chapter,
    sections,
  });

  await writeBookPage({
    siteRoot: paths.siteRoot,
    book: { title: outline.bookTitle, slug: paths.slug },
    chapters: [
      {
        slug: chapter.slug,
        number: chapter.number,
        title: chapter.title,
      },
    ],
  });

  console.log(`Built ${sections.length} section pages for ${chapter.slug}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await buildDaishu1();
}
```

- [ ] **Step 4: Run the final automated checks and build the sample site**

Run:

```bash
node --test tests/browser/math-demos.test.mjs
node --test tests/build-daishu-1.test.mjs
npm run build:daishu-1
find books/daishu-1/site -name '*.html' | sort
```

Expected:
- Both tests PASS
- Build output prints `Built ... section pages for chapter-1`
- Generated HTML includes `index.html`, `chapters/chapter-1.html`, and multiple `sections/chapter-1/*.html`

- [ ] **Step 5: Run a manual browser QA pass**

Run:

```bash
python3 -m http.server 4173 --directory books/daishu-1/site
```

Manual checks:
- Open `http://localhost:4173/index.html`
- Navigate into `chapter-1.html`
- Open `section-1-1.html`
- Confirm source and helper panels are both visible
- Confirm helper disclosure toggles work
- Confirm sample demos render without JavaScript errors

- [ ] **Step 6: Capture a checkpoint**

Run:

```bash
git add shared/scripts/browser/math-demos.js shared/scripts/build-daishu-1.mjs tests/browser/math-demos.test.mjs tests/build-daishu-1.test.mjs
git commit -m "feat: generate daishu chapter one learning site"
```

Expected: a checkpoint commit if Git is initialized

## Self-Review Checklist

- Spec coverage:
  - Dual-layer learning page structure is implemented by Tasks 5-8.
  - `书 -> 章 -> 节` information architecture is implemented by Tasks 4, 6, and 8.
  - Focused interactions are implemented by Tasks 7 and 8.
  - Static generation workflow is implemented by Tasks 1-8.

- Placeholder scan:
  - No `TODO`, `TBD`, or vague “handle later” language remains.
  - Every task lists exact files, commands, and concrete code snippets.

- Type consistency:
  - `buildBookPaths`, `buildDaishu1`, `normalizeDocument`, `buildOutline`, `parseSectionBlocks`, `composeLearningLayer`, `renderSectionPage`, and `initMathDemos` use the same names across all tasks.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-04-17-daishu-1-html-learning-plan.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
