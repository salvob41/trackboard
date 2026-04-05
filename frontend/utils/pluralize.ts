const IRREGULAR: Record<string, string> = {
  Property: 'Properties',
  Category: 'Categories',
  Company: 'Companies',
}

export const pluralize = (word: string): string => {
  if (IRREGULAR[word]) return IRREGULAR[word]
  if (word.endsWith('s') || word.endsWith('x') || word.endsWith('sh') || word.endsWith('ch'))
    return word + 'es'
  if (word.endsWith('y') && !/[aeiou]y$/i.test(word))
    return word.slice(0, -1) + 'ies'
  return word + 's'
}
