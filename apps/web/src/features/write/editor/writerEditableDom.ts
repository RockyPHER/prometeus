export const ZERO_WIDTH_SPACE = "\u200B";

export function toEditableDomText(value: string) {
  return value === "" ? ZERO_WIDTH_SPACE : value;
}

export function readEditableText(element: HTMLElement) {
  return normalizeEditableText(element.innerText);
}

export function writeEditableText(element: HTMLElement, value: string) {
  element.textContent = toEditableDomText(value);
}

export function getLogicalRangeLength(range: Range) {
  return normalizeEditableText(range.toString()).length;
}

export function getLogicalTextLength(value: string) {
  return stripZeroWidthSpaces(value).length;
}

export function getDomOffsetFromLogicalOffset(
  text: string,
  logicalOffset: number,
) {
  const maxLogicalOffset = getLogicalTextLength(text);
  const safeLogicalOffset = Math.max(
    0,
    Math.min(logicalOffset, maxLogicalOffset),
  );

  if (maxLogicalOffset === 0 && text.includes(ZERO_WIDTH_SPACE)) {
    return text.length;
  }

  let remaining = safeLogicalOffset;
  let domOffset = 0;

  for (const character of text) {
    if (remaining === 0 && character !== ZERO_WIDTH_SPACE) {
      return domOffset;
    }

    domOffset += character.length;

    if (character !== ZERO_WIDTH_SPACE) {
      remaining -= 1;
    }
  }

  return domOffset;
}

function normalizeEditableText(value: string) {
  return stripZeroWidthSpaces(value.replace(/\r\n?/g, "\n"));
}

function stripZeroWidthSpaces(value: string) {
  return value.replace(/\u200B/g, "");
}
