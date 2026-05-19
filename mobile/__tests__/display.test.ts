import { ideaMetaLabel, ideaCountLabel } from '../src/lib/display';

test('ideaMetaLabel returns sourceName when present', () => {
  expect(ideaMetaLabel({ type: 'article', sourceName: 'Blog Criativo', source: 'example.com' })).toBe('Blog Criativo');
});

test('ideaMetaLabel falls back to source when sourceName is absent', () => {
  expect(ideaMetaLabel({ type: 'article', source: 'example.com' })).toBe('example.com');
});

test('ideaMetaLabel maps youtube type to YouTube', () => {
  expect(ideaMetaLabel({ type: 'youtube' })).toBe('YouTube');
});

test('ideaMetaLabel maps tweet to X and instagram to Instagram', () => {
  expect(ideaMetaLabel({ type: 'tweet' })).toBe('X');
  expect(ideaMetaLabel({ type: 'instagram' })).toBe('Instagram');
});

test('ideaMetaLabel maps screenshot to Captura and idea to Nota and article to Artigo', () => {
  expect(ideaMetaLabel({ type: 'screenshot' })).toBe('Captura');
  expect(ideaMetaLabel({ type: 'idea' })).toBe('Nota');
  expect(ideaMetaLabel({ type: 'article' })).toBe('Artigo');
});

test('ideaCountLabel returns plural for zero', () => {
  expect(ideaCountLabel(0)).toBe('0 ideias');
});

test('ideaCountLabel returns singular for one', () => {
  expect(ideaCountLabel(1)).toBe('1 ideia');
});

test('ideaCountLabel returns plural for many', () => {
  expect(ideaCountLabel(5)).toBe('5 ideias');
});
