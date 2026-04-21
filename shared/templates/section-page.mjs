import { renderSiteLayout } from './site-layout.mjs';

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("'", '&#39;');
}

function renderTextBlock(text) {
  return escapeHtml(text).replaceAll('\n', '<br />');
}

const BLOCK_LABELS = {
  definition: '定义',
  property: '性质',
  example: '例题',
  exercise: '练习',
  summary: '小结',
  note: '提示',
  'section-intro': '正文',
};

function displayLabel(type) {
  return BLOCK_LABELS[type] ?? '内容';
}

function buildDisplayGroups(blocks) {
  const groups = [];

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];

    if (block.type === 'exercise') {
      const items = [block];

      while (index + 1 < blocks.length && blocks[index + 1].type === 'section-intro') {
        items.push(blocks[index + 1]);
        index += 1;
      }

      groups.push({
        kind: 'exercise',
        id: block.id,
        type: 'exercise',
        blocks: items,
      });
      continue;
    }

    if (block.type === 'section-intro') {
      const items = [block];

      while (index + 1 < blocks.length && blocks[index + 1].type === 'section-intro') {
        items.push(blocks[index + 1]);
        index += 1;
      }

      groups.push({
        kind: 'prose',
        id: block.id,
        type: 'section-intro',
        blocks: items,
      });
      continue;
    }

    groups.push({
      kind: 'callout',
      id: block.id,
      type: block.type,
      blocks: [block],
    });
  }

  return groups;
}

function renderParagraphList(blocks) {
  return blocks
    .map(
      (block) => `
        <p>${renderTextBlock(block.content)}</p>
      `,
    )
    .join('');
}

function renderExerciseGroup(group) {
  return `
    <article class="source-block source-block-exercise" data-block-type="exercise" id="${escapeHtml(group.id)}">
      <header class="block-header">
        <span class="block-badge">练习与思考</span>
        <span class="block-caption">先判断，再回到原文核对</span>
      </header>
      <div class="exercise-stack">
        ${group.blocks
          .map(
            (block, index) => `
              <section class="exercise-item">
                ${index === 0 ? `<h3>${renderTextBlock(block.content)}</h3>` : `<p>${renderTextBlock(block.content)}</p>`}
              </section>
            `,
          )
          .join('')}
      </div>
    </article>
  `;
}

function renderCalloutGroup(group) {
  const block = group.blocks[0];

  return `
    <article class="source-block source-block-callout" data-block-type="${escapeHtml(group.type)}" id="${escapeHtml(group.id)}">
      <header class="block-header">
        <span class="block-badge">${escapeHtml(displayLabel(group.type))}</span>
      </header>
      <div class="block-content">
        <p>${renderTextBlock(block.content)}</p>
      </div>
    </article>
  `;
}

function renderProseGroup(group) {
  return `
    <article class="source-block source-block-prose" data-block-type="section-intro" id="${escapeHtml(group.id)}">
      <div class="prose-rail"></div>
      <div class="block-content prose-content">
        ${renderParagraphList(group.blocks)}
      </div>
    </article>
  `;
}

function renderBlocks(blocks) {
  return buildDisplayGroups(blocks)
    .map((group) => {
      if (group.kind === 'exercise') {
        return renderExerciseGroup(group);
      }

      if (group.kind === 'callout') {
        return renderCalloutGroup(group);
      }

      return renderProseGroup(group);
    })
    .join('\n');
}

function renderPageRange(pageRange = []) {
  if (!Array.isArray(pageRange) || pageRange.length === 0) {
    return '';
  }

  if (pageRange[0] === pageRange[1] || pageRange.length === 1) {
    return `原书第 ${escapeHtml(pageRange[0])} 页`;
  }

  return `原书第 ${escapeHtml(pageRange[0])}-${escapeHtml(pageRange[1])} 页`;
}

export function renderSectionPage({
  book,
  chapter,
  section,
  blocks,
  learningLayer,
  scripts = [],
}) {
  const unit = chapter.units?.find((candidate) => candidate.slug === section.unitSlug) ?? null;
  const conceptCount = blocks.filter(
    (block) => block.type === 'definition' || block.type === 'property',
  ).length;
  const practiceCount = blocks.filter((block) => block.type === 'exercise').length;
  const goals = learningLayer.learningGoals.map((goal) => `<li>${escapeHtml(goal)}</li>`).join('');
  const keyPoints = learningLayer.keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join('');
  const commonMistakes = (learningLayer.commonMistakes ?? [])
    .map((point) => `<li>${escapeHtml(point)}</li>`)
    .join('');
  const demos = learningLayer.interactiveDemos
    .map(
      (demo) => `
        <section class="helper-card helper-card-demo demo-card" data-demo-kind="${escapeHtml(demo.kind)}">
          <div class="card-eyebrow">直观理解</div>
          <h2>${escapeHtml(demo.title)}</h2>
          <div class="demo-root" data-demo-config='${escapeAttribute(JSON.stringify(demo))}'></div>
        </section>
      `,
    )
    .join('');

  return renderSiteLayout({
    title: `${section.number} ${section.title} - ${book.title}`,
    bodyClass: 'page-section',
    stylesheetPath: '../../assets/site.css',
    scripts,
    body: `
      <nav class="breadcrumbs">
        <a href="../../index.html">${escapeHtml(book.title)}</a>
        <a href="../../chapters/${escapeHtml(chapter.slug)}.html">${escapeHtml(chapter.title)}</a>
        <span>${escapeHtml(section.number)} ${escapeHtml(section.title)}</span>
      </nav>
      <header class="page-hero lesson-hero">
        <div class="lesson-hero-copy">
          <p class="page-kicker">${escapeHtml(chapter.title)}</p>
          <h1>${escapeHtml(section.number)} ${escapeHtml(section.title)}</h1>
          <p class="lesson-lead">
            ${escapeHtml(learningLayer.learningGoals[0] ?? `围绕 ${section.title} 建立清晰的概念框架。`)}
          </p>
          <div class="meta-strip">
            ${unit ? `<span class="meta-pill">单元：${escapeHtml(unit.title)}</span>` : ''}
            <span class="meta-pill">${renderPageRange(section.pageRange)}</span>
            <span class="meta-pill">关键概念 ${escapeHtml(conceptCount)}</span>
            <span class="meta-pill">练习模块 ${escapeHtml(practiceCount)}</span>
          </div>
        </div>
        <div class="lesson-hero-panel">
          <div class="hero-panel-card">
            <div class="hero-panel-label">本节抓手</div>
            <p>${escapeHtml(learningLayer.keyPoints[0] ?? section.title)}</p>
          </div>
          <div class="hero-panel-card">
            <div class="hero-panel-label">建议顺序</div>
            <p>先读正文，再看定义卡片，最后做练习与演示。</p>
          </div>
        </div>
      </header>
      <main class="section-layout lesson-layout">
        <section class="source-column lesson-main">
          <section class="section-panel">
            <header class="panel-header">
              <div>
                <div class="card-eyebrow">教材原文</div>
                <h2>按理解节奏整理后的主线</h2>
              </div>
            </header>
            <div class="source-flow">
              ${renderBlocks(blocks)}
            </div>
          </section>
        </section>
        <aside class="support-column lesson-sidebar">
          <section class="helper-card">
            <div class="card-eyebrow">学习导航</div>
            <h2>先抓什么</h2>
            <ul>${goals}</ul>
          </section>
          <section class="helper-card">
            <div class="card-eyebrow">关键概念</div>
            <h2>这节要记住的点</h2>
            <ul>${keyPoints}</ul>
          </section>
          ${
            commonMistakes
              ? `
          <section class="helper-card">
            <div class="card-eyebrow">易错提醒</div>
            <h2>哪些地方容易混</h2>
            <ul>${commonMistakes}</ul>
          </section>
          `
              : ''
          }
          ${demos}
        </aside>
      </main>
    `,
  });
}
