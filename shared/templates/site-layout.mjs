function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderSiteLayout({
  title,
  bodyClass,
  body,
  scripts = [],
  stylesheetPath = 'assets/site.css',
}) {
  const scriptTags = scripts
    .map((scriptPath) => `<script type="module" src="${escapeHtml(scriptPath)}"></script>`)
    .join('\n');

  return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="${escapeHtml(stylesheetPath)}" />
  </head>
  <body class="${escapeHtml(bodyClass)}">
    ${body}
    ${scriptTags}
  </body>
</html>`;
}
