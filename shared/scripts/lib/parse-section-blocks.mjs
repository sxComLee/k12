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

function isSectionHeading(paragraph, section) {
  if (section.number && paragraph.startsWith(section.number)) {
    return true;
  }

  const sectionHeadingMatch = paragraph.match(/^(\d+\.\d+)\s+(.+)$/);
  return sectionHeadingMatch?.[2] === section.title;
}

function isExampleParagraph(paragraph) {
  return /^例\s*\d+/.test(paragraph);
}

function isSolutionParagraph(paragraph) {
  return /^解[:：]?/.test(paragraph);
}

function isExerciseHeading(paragraph) {
  return /^(练\s*习|习题\s*[一二三四五六七八九十]+|复习参考题)/.test(paragraph);
}

function isNumberedPrompt(paragraph) {
  return /^\d+[.．、]\s*/.test(paragraph);
}

export function parseSectionBlocks(section) {
  const paragraphs = section.text
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .filter((paragraph) => !isSectionHeading(paragraph, section));

  const blocks = [];

  for (const paragraph of paragraphs) {
    const type = classifyParagraph(paragraph);
    const previous = blocks.at(-1);
    const shouldAppend =
      (previous && isExampleParagraph(previous.content) && isSolutionParagraph(paragraph)) ||
      (previous &&
        isExerciseHeading(previous.content) &&
        isNumberedPrompt(paragraph) &&
        !/\n\n\d+[.．、]\s*/.test(previous.content));

    if (shouldAppend) {
      previous.content += `\n\n${paragraph}`;
      continue;
    }

    blocks.push({
      id: `${section.slug}-block-${blocks.length + 1}`,
      type,
      content: paragraph,
    });
  }

  return blocks;
}
