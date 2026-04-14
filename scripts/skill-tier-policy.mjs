export const SKILL_TIER_MINIMUMS = {
  standard: { minWords: 60, minHeadings: 1, minChecklistItems: 0, minCodeBlocks: 0 },
  advance: { minWords: 100, minHeadings: 2, minChecklistItems: 1, minCodeBlocks: 0 },
  expert: { minWords: 130, minHeadings: 3, minChecklistItems: 1, minCodeBlocks: 0 },
  above: { minWords: 240, minHeadings: 3, minChecklistItems: 1, minCodeBlocks: 1 },
};

export function countWords(markdownContent) {
  return markdownContent
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[^A-Za-z0-9_\-\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function countMarkdownHeadings(markdownContent) {
  const headingMatches = markdownContent.match(/^#{2,6}\s+/gm);
  return headingMatches ? headingMatches.length : 0;
}

export function countChecklistItems(markdownContent) {
  const checklistMatches = markdownContent.match(/^\s*[-*]\s+\[[ xX]\]\s+/gm);
  return checklistMatches ? checklistMatches.length : 0;
}

export function countCodeBlocks(markdownContent) {
  const fenceMatches = markdownContent.match(/```/g);
  if (!fenceMatches) {
    return 0;
  }

  return Math.floor(fenceMatches.length / 2);
}

export function extractSkillTier(markdownContent) {
  const normalizedMarkdownContent = markdownContent.replace(/\*\*/g, '');
  const tierMatch = normalizedMarkdownContent.match(/\bTier\s*:\s*`?(standard|advance|expert|above)`?\b/i);
  return tierMatch ? tierMatch[1].toLowerCase() : null;
}

export function validateSkillTopicContent(markdownContent) {
  const detectedTier = extractSkillTier(markdownContent);

  if (!detectedTier) {
    return { isValid: false, reason: 'missing-tier' };
  }

  const minimumRules = SKILL_TIER_MINIMUMS[detectedTier];
  if (!minimumRules) {
    return { isValid: false, reason: 'unsupported-tier', detectedTier };
  }

  const wordCount = countWords(markdownContent);
  const headingCount = countMarkdownHeadings(markdownContent);
  const checklistCount = countChecklistItems(markdownContent);
  const codeBlockCount = countCodeBlocks(markdownContent);

  if (wordCount < minimumRules.minWords) {
    return { isValid: false, reason: 'word-count', detectedTier, wordCount, minimumRules };
  }

  if (headingCount < minimumRules.minHeadings) {
    return { isValid: false, reason: 'heading-count', detectedTier, headingCount, minimumRules };
  }

  if (checklistCount < minimumRules.minChecklistItems) {
    return { isValid: false, reason: 'checklist-count', detectedTier, checklistCount, minimumRules };
  }

  if (codeBlockCount < minimumRules.minCodeBlocks) {
    return { isValid: false, reason: 'code-block-count', detectedTier, codeBlockCount, minimumRules };
  }

  return { isValid: true, detectedTier, wordCount, headingCount, checklistCount, codeBlockCount, minimumRules };
}