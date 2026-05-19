import { truncateText } from '../src/lib/truncate';

test('truncateText returns short text unchanged', () => {
  expect(truncateText('Nota curta', 20)).toBe('Nota curta');
});

test('truncateText truncates text over limit and appends ellipsis', () => {
  expect(truncateText('Nota longa demais', 4)).toBe('Nota…');
});

test('truncateText returns text unchanged when length equals maxChars', () => {
  expect(truncateText('Nota', 4)).toBe('Nota');
});

test('truncateText strips trailing space when cut point lands on a space', () => {
  expect(truncateText('aa bb cc', 3)).toBe('aa…');
});
