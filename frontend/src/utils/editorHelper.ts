/**
 * Editor Helper utilities for TipTap Rich Text Editor
 * Handles backwards compatibility with existing plain text, markdown notes, checklists & images
 */

export function convertLegacyContentToHtml(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // If already structured HTML with common tags, return as-is
  if (/<(p|div|h[1-6]|ul|ol|table|blockquote|span|mark|b|strong|i|em|hr|pre|code|img)[^>]*>/i.test(trimmed)) {
    return raw;
  }

  // Convert legacy markdown checklists to TipTap taskList HTML
  let formatted = raw;
  if (/^- \[( |x)\] /im.test(formatted)) {
    const lines = formatted.split('\n');
    let inTaskList = false;
    const transformedLines: string[] = [];

    for (const line of lines) {
      const match = line.match(/^- \[( |x)\] (.*)$/i);
      if (match) {
        if (!inTaskList) {
          transformedLines.push('<ul data-type="taskList">');
          inTaskList = true;
        }
        const isChecked = match[1].toLowerCase() === 'x';
        transformedLines.push(
          `<li data-type="taskItem" data-checked="${isChecked}"><p>${match[2]}</p></li>`
        );
      } else {
        if (inTaskList) {
          transformedLines.push('</ul>');
          inTaskList = false;
        }
        transformedLines.push(line);
      }
    }
    if (inTaskList) {
      transformedLines.push('</ul>');
    }
    formatted = transformedLines.join('\n');
  }

  // Convert legacy markdown patterns to HTML tags
  formatted = formatted
    // Markdown images: ![alt](url)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" />')
    // Bold: **text**
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic: *text*
    .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
    // Strikethrough: ~~text~~
    .replace(/~~(.*?)~~/g, '<s>$1</s>')
    // Inline code: `code`
    .replace(/`([^`]+)`/g, '<code>$1</code>');

  // Convert double line-breaks to paragraphs, single line-breaks to <br>
  const paragraphs = formatted.split(/\n\n+/);
  return paragraphs
    .map((p) => {
      // Don't wrap already closed taskList blocks inside <p>
      if (p.startsWith('<ul data-type="taskList">')) return p;
      const lines = p.split('\n').join('<br>');
      return `<p>${lines}</p>`;
    })
    .join('');
}

export function stripHtmlTags(html: string): string {
  if (!html || typeof html !== 'string') return '';
  return html
    // Format checklist items with readable checkboxes
    .replace(/<li[^>]*data-checked="true"[^>]*>/gi, '☑ ')
    .replace(/<li[^>]*data-checked="false"[^>]*>/gi, '☐ ')
    // Convert block closures to line breaks
    .replace(/<\/(p|li|h[1-6]|tr|div|blockquote)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    // Remove all remaining HTML tags
    .replace(/<[^>]*>?/gm, '')
    // Decode HTML entities
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    // Clean markdown remnants if any
    .replace(/[#*`_~]/g, '')
    // Normalize spaces and clean up blank lines
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s+/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
