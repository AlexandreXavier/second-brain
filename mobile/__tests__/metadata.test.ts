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

test('createPreviewFromUrl populates article metadata from microlink', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      status: 'success',
      data: {
        title: 'Como criar conteudo de qualidade',
        description: 'Um guia para criadores de video',
        publisher: 'Blog Criativo',
        image: { url: 'https://example.com/imagem.jpg' },
      },
    }),
  } as Response);

  const draft = await createPreviewFromUrl('https://example.com/artigo');
  expect(draft.title).toBe('Como criar conteudo de qualidade');
  expect(draft.description).toBe('Um guia para criadores de video');
  expect(draft.sourceName).toBe('Blog Criativo');
  expect(draft.thumbnailUrl).toBe('https://example.com/imagem.jpg');
});

test('createPreviewFromUrl strips HTML tags from tweet oEmbed previewText', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      author_name: 'Utilizador X',
      provider_name: 'X',
      html: '<blockquote>Este e o texto do tweet <a href="#">#link</a></blockquote>',
    }),
  } as Response);

  const draft = await createPreviewFromUrl('https://x.com/utilizador/status/123');
  expect(draft.type).toBe('tweet');
  expect(draft.previewText).not.toContain('<');
  expect(draft.previewText).toContain('Este e o texto do tweet');
});

test('createPreviewFromUrl sets author from handle in tweet oEmbed fallback', async () => {
  const draft = await createPreviewFromUrl('https://x.com/canal_criativo/status/123');
  expect(draft.type).toBe('tweet');
  expect(draft.author).toBe('@canal_criativo');
});

test('createPreviewFromUrl extracts channel handle as author for Instagram user URL', async () => {
  const draft = await createPreviewFromUrl('https://instagram.com/canal_criativo');
  expect(draft.type).toBe('instagram');
  expect(draft.author).toBe('@canal_criativo');
});

test('createPreviewFromUrl populates title and author from YouTube oEmbed', async () => {
  jest.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      title: 'Como fazer um video viral',
      author_name: 'Canal Criativo',
      provider_name: 'YouTube',
      thumbnail_url: 'https://i.ytimg.com/vi/abc123/hqdefault.jpg',
    }),
  } as Response);

  const draft = await createPreviewFromUrl('https://youtube.com/watch?v=abc123');
  expect(draft.title).toBe('Como fazer um video viral');
  expect(draft.author).toBe('Canal Criativo');
  expect(draft.thumbnailUrl).toBe('https://i.ytimg.com/vi/abc123/hqdefault.jpg');
});
