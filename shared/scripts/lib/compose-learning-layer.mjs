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
