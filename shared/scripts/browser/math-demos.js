export function sampleFunctionPoints(base, { xMin, xMax, step, curve = 'exponential' }) {
  const points = [];

  for (let x = xMin; x <= xMax + Number.EPSILON; x += step) {
    const yValue =
      curve === 'logarithmic' ? Math.log(x) / Math.log(base) : base ** x;
    points.push({
      x: Number(x.toFixed(4)),
      y: Number(yValue.toFixed(4)),
    });
  }

  return points;
}

function renderSetDemo(root, config) {
  root.innerHTML = `
    <div class="demo-heading">${config.title}</div>
    <div class="demo-copy">切换模式后观察集合关系如何变化。</div>
    <div class="demo-mode-list">
      ${(config.modes ?? []).map((mode) => `<button type="button">${mode}</button>`).join('')}
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
    try {
      const rawConfig = node.dataset.demoConfig;

      if (!rawConfig) {
        return;
      }

      const config = JSON.parse(rawConfig);

      if (config.kind === 'set-operations') {
        renderSetDemo(node, config);
        return;
      }

      if (config.kind === 'function-family' && Array.isArray(config.bases)) {
        renderFunctionDemo(node, config);
      }
    } catch {
      // Skip malformed demo nodes so one bad config does not block the page.
    }
  });
}

if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initMathDemos(document);
  });
}
