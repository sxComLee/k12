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
