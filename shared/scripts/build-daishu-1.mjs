import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

import { renderSectionPage } from '../templates/section-page.mjs';
import { normalizeDocument } from './lib/normalize-text.mjs';
import { buildOutline } from './lib/parse-outline.mjs';
import { parseSectionBlocks } from './lib/parse-section-blocks.mjs';
import { composeLearningLayer } from './lib/compose-learning-layer.mjs';
import {
  copySharedAssets,
  writeBookPage,
  writeChapterPage,
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

function trimSectionLead(text, section) {
  const heading = `${section.number} ${section.title}`;
  const headingIndex = text.indexOf(heading);

  if (headingIndex === -1) {
    return text;
  }

  return text.slice(headingIndex);
}

function availableSectionScripts(siteRoot) {
  const assetCandidates = [
    ['learning-ui.js', '../../assets/learning-ui.js'],
    ['math-demos.js', '../../assets/math-demos.js'],
  ];

  return assetCandidates
    .filter(([fileName]) => existsSync(resolve(siteRoot, 'assets', fileName)))
    .map(([, publicPath]) => publicPath);
}

async function writeSectionPages({ siteRoot, book, chapter, sections, scripts }) {
  for (const section of sections) {
    const outPath = resolve(siteRoot, 'sections', chapter.slug, `${section.slug}.html`);
    await mkdir(resolve(siteRoot, 'sections', chapter.slug), { recursive: true });
    await writeFile(
      outPath,
      renderSectionPage({
        book,
        chapter,
        section,
        blocks: section.blocks,
        learningLayer: section.learningLayer,
        scripts,
      }),
      'utf8',
    );
  }
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

  if (!chapter) {
    throw new Error('No chapter outline generated for daishu-1');
  }

  const overrides = JSON.parse(await readFile(paths.overridesPath, 'utf8'));
  const chapterEndPage = outline.chapters[1]?.startPage
    ? outline.chapters[1].startPage - 1
    : normalizedDoc.pages.at(-1).pageNumber;

  const sections = chapter.sections.map((section, index) => {
    const pageRange = pageRangeForSection(chapter, index, chapterEndPage);
    const text = trimSectionLead(collectSectionText(normalizedDoc.pages, pageRange), section);
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
  const sectionScripts = availableSectionScripts(paths.siteRoot);

  await writeSectionPages({
    siteRoot: paths.siteRoot,
    book: { title: outline.bookTitle, slug: paths.slug },
    chapter,
    sections,
    scripts: sectionScripts,
  });

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
