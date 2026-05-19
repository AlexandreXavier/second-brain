import { parseCategories, formatCategories } from '../src/lib/metadata';

test('parseCategories splits comma-separated values', () => {
  expect(parseCategories('Video, Humor, Viagens')).toEqual(['Video', 'Humor', 'Viagens']);
});

test('parseCategories trims whitespace', () => {
  expect(parseCategories('  Video , Humor  ')).toEqual(['Video', 'Humor']);
});

test('parseCategories returns empty array for empty string', () => {
  expect(parseCategories('')).toEqual([]);
});

test('parseCategories deduplicates values', () => {
  expect(parseCategories('Video, Video')).toEqual(['Video']);
});

test('formatCategories joins with comma and space', () => {
  expect(formatCategories(['Video', 'Humor'])).toBe('Video, Humor');
});

test('formatCategories returns empty string for empty array', () => {
  expect(formatCategories([])).toBe('');
});
