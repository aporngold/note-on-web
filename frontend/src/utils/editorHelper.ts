/**
 * Editor Helper utilities for TipTap Rich Text Editor
 * Handles backwards compatibility with existing plain text & markdown notes
 */

export function convertLegacyContentToHtml(raw: string): string {
  if (!raw || typeof raw !== 'string') return '';
  const trimmed = raw.trim();
  if (!trimmed) return '';

  // If already structured HTML with common tags, return as-is
  if (/<(p|div|h[1-6]|ul|ol|table|blockquote|span|mark|b|strong|i|em|hr|pre|code)[^>]*>/i.test(trimmed)) {
    return raw;
  }

  // Convert legacy markdown patterns to HTML tags
  let formatted = raw
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
      const lines = p.split('\n').join('<br>');
      return `<p>${lines}</p>`;
    })
    .join('');
}

export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/[#*`_~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
