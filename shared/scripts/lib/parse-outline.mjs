const CHAPTER_PATTERN = /^第([一二三四五六七八九十百千〇零]+)章\s+(.+)$/;
const UNIT_PATTERN = /^([一二三四五六七八九十]+)\s+(.+)$/;
const SECTION_PATTERN = /^(\d+)\.(\d+)\s+(.+)$/;

function toChapterNumber(chineseNumber) {
  const digits = new Map([
    ['零', 0],
    ['〇', 0],
    ['一', 1],
    ['二', 2],
    ['三', 3],
    ['四', 4],
    ['五', 5],
    ['六', 6],
    ['七', 7],
    ['八', 8],
    ['九', 9],
  ]);
  const units = new Map([
    ['十', 10],
    ['百', 100],
    ['千', 1000],
  ]);

  if (!/^[一二三四五六七八九十百千〇零]+$/.test(chineseNumber)) {
    throw new Error(`Unsupported chapter numeral: ${chineseNumber}`);
  }

  let total = 0;
  let current = 0;

  for (const char of chineseNumber) {
    if (digits.has(char)) {
      current = digits.get(char);
      continue;
    }

    const unit = units.get(char);
    if (unit) {
      total += (current === 0 ? 1 : current) * unit;
      current = 0;
      continue;
    }

    throw new Error(`Unsupported chapter numeral: ${chineseNumber}`);
  }

  total += current;

  if (total <= 0) {
    throw new Error(`Unsupported chapter numeral: ${chineseNumber}`);
  }

  return total;
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
