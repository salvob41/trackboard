const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export const linkify = (text: string | null | undefined): string => {
  if (!text) return ''
  // Match URLs before escaping so & in query params isn't pre-escaped to &amp;
  // and then treated as a URL terminator by the regex.
  const urlRegex = /(https?:\/\/[^\s<]+)/g
  const parts: string[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = urlRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(escapeHtml(text.slice(lastIndex, match.index)))
    }
    const url = match[1]
    const escapedUrl = escapeHtml(url)
    parts.push(`<a href="${escapedUrl}" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">${escapedUrl}</a>`)
    lastIndex = match.index + match[0].length
  }

  if (lastIndex < text.length) {
    parts.push(escapeHtml(text.slice(lastIndex)))
  }

  return parts.join('')
}
