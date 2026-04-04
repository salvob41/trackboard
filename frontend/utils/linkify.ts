const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')

export const linkify = (text: string | null | undefined): string => {
  if (!text) return ''
  const escaped = escapeHtml(text)
  const urlRegex = /(https?:\/\/[^\s<&]+)/g
  return escaped.replace(
    urlRegex,
    '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>',
  )
}
