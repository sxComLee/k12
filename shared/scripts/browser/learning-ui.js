const boundDisclosureButtons = new WeakSet();
const boundMapButtons = new WeakSet();

function resolveDisclosurePanel(root, button) {
  const targetId = button.dataset.disclosureTrigger;
  if (!targetId) {
    return null;
  }

  if (typeof root.getElementById === 'function') {
    return root.getElementById(targetId);
  }

  return button.ownerDocument?.getElementById(targetId) ?? null;
}

export function initLearningUi(root = document) {
  root.querySelectorAll('[data-disclosure-trigger]').forEach((button) => {
    if (boundDisclosureButtons.has(button)) {
      return;
    }

    boundDisclosureButtons.add(button);
    button.addEventListener('click', () => {
      const panel = resolveDisclosurePanel(root, button);

      if (!panel) {
        return;
      }

      panel.hidden = !panel.hidden;
      button.setAttribute('aria-expanded', String(!panel.hidden));
    });
  });

  root.querySelectorAll('[data-map-target]').forEach((button) => {
    if (boundMapButtons.has(button)) {
      return;
    }

    boundMapButtons.add(button);
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
