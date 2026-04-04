import { describe, it, expect } from 'vitest'
import { linkify } from '../../utils/linkify'

describe('linkify', () => {
  it('returns empty string for null/undefined', () => {
    expect(linkify(null)).toBe('')
    expect(linkify(undefined)).toBe('')
    expect(linkify('')).toBe('')
  })

  it('escapes HTML in plain text', () => {
    expect(linkify('<script>alert("xss")</script>')).toBe(
      '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
    )
  })

  it('converts URLs to clickable links', () => {
    const result = linkify('Check https://example.com for details')
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('target="_blank"')
  })

  it('preserves query params with & in URLs', () => {
    const result = linkify('Visit https://example.com/search?a=1&b=2&c=3 now')
    expect(result).toContain('href="https://example.com/search?a=1&amp;b=2&amp;c=3"')
    expect(result).toContain('>https://example.com/search?a=1&amp;b=2&amp;c=3</a>')
  })

  it('escapes HTML around URLs', () => {
    const result = linkify('<b>https://example.com</b>')
    expect(result).toContain('&lt;b&gt;')
    expect(result).toContain('href="https://example.com"')
    expect(result).toContain('&lt;/b&gt;')
  })

  it('handles multiple URLs', () => {
    const result = linkify('See https://a.com and https://b.com')
    expect(result).toContain('href="https://a.com"')
    expect(result).toContain('href="https://b.com"')
  })
})
