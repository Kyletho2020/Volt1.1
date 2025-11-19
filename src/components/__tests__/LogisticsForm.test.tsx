import { it, expect } from 'vitest';
import { formatDescriptionInputValue } from '../LogisticsForm';

it('formatDescriptionInputValue preserves trailing spaces for active input', () => {
  const valueWithTrailingSpace = formatDescriptionInputValue('steel ', { approximateLabelEnabled: false });
  expect(valueWithTrailingSpace).toBe('Steel ');

  const trimmedValue = formatDescriptionInputValue('steel beam', { approximateLabelEnabled: false });
  expect(trimmedValue).toBe('Steel Beam');
});

it('formatDescriptionInputValue only applies a single approx suffix', () => {
  const initialValue = formatDescriptionInputValue('steel ', { approximateLabelEnabled: true });
  expect(initialValue).toBe('Steel (approx.) ');

  const continuedInput = formatDescriptionInputValue('Steel (approx.) beam', { approximateLabelEnabled: true });
  expect(continuedInput).toBe('Steel Beam (approx.)');

  const repeatedInput = formatDescriptionInputValue('Steel (approx.) Beam (approx.) Column', {
    approximateLabelEnabled: true
  });
  expect(repeatedInput).toBe('Steel Beam Column (approx.)');
});
