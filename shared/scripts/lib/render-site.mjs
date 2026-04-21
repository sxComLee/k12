import { access, cp, mkdir, writeFile } from 'node:fs/promises';
import { constants } from 'node:fs';
import { resolve } from 'node:path';

import { renderBookPage } from '../../templates/book-page.mjs';
import { renderChapterPage } from '../../templates/chapter-page.mjs';
import { renderSectionPage } from '../../templates/section-page.mjs';

async function copyIfExists(fromPath, toPath) {
  try {
    await access(fromPath, constants.F_OK);
  } catch {
    return;
  }

  await cp(fromPath, toPath);
}

export async function writeBookPage({ siteRoot, book, chapters }) {
  await writeFile(resolve(siteRoot, 'index.html'), renderBookPage({ book, chapters }), 'utf8');
}

export async function writeChapterPage({ siteRoot, book, chapter, sections }) {
  const outPath = resolve(siteRoot, 'chapters', `${chapter.slug}.html`);
  await mkdir(resolve(siteRoot, 'chapters'), { recursive: true });
  await writeFile(outPath, renderChapterPage({ book, chapter, sections }), 'utf8');
}

export async function writeSectionPage({
  siteRoot,
  book,
  chapter,
  section,
  blocks = section.blocks,
  learningLayer = section.learningLayer,
}) {
  const outPath = resolve(siteRoot, 'sections', chapter.slug, `${section.slug}.html`);
  await mkdir(resolve(siteRoot, 'sections', chapter.slug), { recursive: true });
  await writeFile(
    outPath,
    renderSectionPage({ book, chapter, section, blocks, learningLayer }),
    'utf8',
  );
}

export async function copySharedAssets({ root, siteRoot }) {
  await mkdir(resolve(siteRoot, 'assets'), { recursive: true });
  await cp(resolve(root, 'shared/styles/site.css'), resolve(siteRoot, 'assets/site.css'));
  await copyIfExists(
    resolve(root, 'shared/scripts/browser/learning-ui.js'),
    resolve(siteRoot, 'assets/learning-ui.js'),
  );
  await copyIfExists(
    resolve(root, 'shared/scripts/browser/math-demos.js'),
    resolve(siteRoot, 'assets/math-demos.js'),
  );
}
