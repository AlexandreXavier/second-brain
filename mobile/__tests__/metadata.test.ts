import { parseCategories, formatCategories, createPreviewFromUrl } from '../src/lib/metadata';

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockRejectedValue(new Error('sem rede'));
});
afterEach(() => {
  jest.restoreAllMocks();
});

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

test('createPreviewFromUrl returns idea type for plain text', async () => {
  const draft = await createPreviewFromUrl('Ideia para video');
  expect(draft.type).toBe('idea');
  expect(draft.title).toBe('Ideia para video');
});

test('createPreviewFromUrl returns fallback title for empty string', async () => {
  const draft = await createPreviewFromUrl('');
  expect(draft.type).toBe('idea');
  expect(draft.title).toBe('Ideia solta');
});

test('createPreviewFromUrl classifies YouTube watch URL', async () => {
  const draft = await createPreviewFromUrl('https://youtube.com/watch?v=abc123');
  expect(draft.type).toBe('youtube');
  expect(draft.source).toBe('YouTube');
});

test('createPreviewFromUrl classifies youtu.be short URL', async () => {
  const draft = await createPreviewFromUrl('https://youtu.be/abc123');
  expect(draft.type).toBe('youtube');
});

test('createPreviewFromUrl classifies X/Twitter URL', async () => {
  const draft = await createPreviewFromUrl('https://x.com/user/status/123');
  expect(draft.type).toBe('tweet');
  expect(draft.source).toBe('X');
});

test('createPreviewFromUrl classifies Instagram URL', async () => {
  const draft = await createPreviewFromUrl('https://instagram.com/p/abc');
  expect(draft.type).toBe('instagram');
  expect(draft.source).toBe('Instagram');
});

test('createPreviewFromUrl classifies generic URL as article', async () => {
  const draft = await createPreviewFromUrl('https://example.com/artigo');
  expect(draft.type).toBe('article');
});
