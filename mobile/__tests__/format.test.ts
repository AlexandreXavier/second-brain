import { formatDate } from '../src/lib/format';

test('formatDate returns a pt-PT date string from a valid timestamp', () => {
  const ts = { toDate: () => new Date('2026-05-19T10:00:00Z') };
  expect(formatDate(ts)).toMatch(/2026/);
});

test('formatDate returns empty string when timestamp is null', () => {
  expect(formatDate(null)).toBe('');
});

test('formatDate returns empty string when timestamp is undefined', () => {
  expect(formatDate(undefined)).toBe('');
});
