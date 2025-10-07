const LOWERCASE_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'but',
  'or',
  'nor',
  'for',
  'yet',
  'in',
  'on',
  'at',
  'by',
  'of',
  'to',
  'up'
])

const processWord = (word: string, index: number, totalWords: number): string => {
  if (!word) {
    return word
  }

  const leading = word.match(/^[^A-Za-z0-9]+/u)?.[0] ?? ''
  const trailing = word.match(/[^A-Za-z0-9]+$/u)?.[0] ?? ''
  const core = word.slice(leading.length, word.length - trailing.length)

  if (!core) {
    return word
  }

  const shouldAlwaysCapitalize = index === 0 || index === totalWords - 1
  const parts = core.split('-')

  const transformed = parts
    .map((part, partIndex) => {
      if (!part) {
        return part
      }

      const lowerPart = part.toLowerCase()
      const shouldCapitalize =
        shouldAlwaysCapitalize || !LOWERCASE_WORDS.has(lowerPart) || partIndex > 0

      if (!shouldCapitalize) {
        return lowerPart
      }

      const isAllCaps = part === part.toUpperCase() && /[A-Z]/.test(part)

      if (isAllCaps) {
        return part
      }

      const firstChar = lowerPart[0]?.toUpperCase() ?? ''
      const originalRest = part.slice(1)
      const lowerRest = lowerPart.slice(1)
      const hasUppercaseInRest = /[A-Z]/.test(originalRest)
      const hasLowercaseInRest = /[a-z]/.test(originalRest)

      if (hasUppercaseInRest && hasLowercaseInRest) {
        return `${firstChar}${originalRest}`
      }

      return `${firstChar}${lowerRest}`
    })
    .join('-')

  return `${leading}${transformed}${trailing}`
}

export const toTitleCase = (input: string): string => {
  if (!input) {
    return input
  }

  const leadingWhitespace = input.match(/^\s+/)?.[0] ?? ''
  const trailingWhitespace = input.match(/\s+$/)?.[0] ?? ''
  const trimmed = input.trim()

  if (!trimmed) {
    return input
  }

  const words = trimmed.split(/\s+/)
  const totalWords = words.length

  const transformedWords = words.map((word, index) =>
    processWord(word, index, totalWords)
  )

  return `${leadingWhitespace}${transformedWords.join(' ')}${trailingWhitespace}`
}

export default toTitleCase
