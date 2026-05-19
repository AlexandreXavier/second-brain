import { buildCaptureDraft, patchDraftWithImage } from '../src/lib/capture';
import { createPreviewFromUrl } from '../src/lib/metadata';
import { suggestTitle } from '../src/lib/title';

jest.mock('../src/lib/metadata');
jest.mock('../src/lib/title');

const mockCreatePreview = createPreviewFromUrl as jest.MockedFunction<typeof createPreviewFromUrl>;
const mockSuggestTitle = suggestTitle as jest.MockedFunction<typeof suggestTitle>;

afterEach(() => {
  jest.clearAllMocks();
});

test('buildCaptureDraft returns draft with AI-suggested title', async () => {
  mockCreatePreview.mockResolvedValue({ type: 'youtube', title: '', categories: [], source: 'YouTube' });
  mockSuggestTitle.mockResolvedValue('Titulo gerado pela IA');

  const draft = await buildCaptureDraft('https://youtube.com/watch?v=abc', 'meu-token');

  expect(draft.title).toBe('Titulo gerado pela IA');
});

test('buildCaptureDraft keeps original title when suggestTitle returns null', async () => {
  mockCreatePreview.mockResolvedValue({ type: 'article', title: 'Titulo original', categories: [] });
  mockSuggestTitle.mockResolvedValue(null);

  const draft = await buildCaptureDraft('https://example.com/artigo', 'meu-token');

  expect(draft.title).toBe('Titulo original');
});

test('buildCaptureDraft skips suggestTitle when idToken is null', async () => {
  mockCreatePreview.mockResolvedValue({ type: 'idea', title: 'Ideia solta', categories: [] });

  await buildCaptureDraft('Ideia solta', null);

  expect(mockSuggestTitle).not.toHaveBeenCalled();
});

test('patchDraftWithImage always sets type to screenshot', () => {
  const result = patchDraftWithImage(null, undefined);
  expect(result.type).toBe('screenshot');
});

test('patchDraftWithImage preserves existing title from prev draft', () => {
  const result = patchDraftWithImage({ type: 'youtube', title: 'Video incrivel', categories: [] }, 'outro.jpg');
  expect(result.title).toBe('Video incrivel');
});

test('patchDraftWithImage derives title from fileName by stripping extension', () => {
  const result = patchDraftWithImage(null, 'clip_gravado.mp4');
  expect(result.title).toBe('clip_gravado');
});

test('patchDraftWithImage falls back to Captura when no title and no fileName', () => {
  const result = patchDraftWithImage(null, undefined);
  expect(result.title).toBe('Captura');
});

test('patchDraftWithImage preserves other fields from prev draft', () => {
  const prev = { type: 'article' as const, title: 'Artigo', categories: ['Video'], url: 'https://example.com' };
  const result = patchDraftWithImage(prev, undefined);
  expect(result.categories).toEqual(['Video']);
  expect(result.url).toBe('https://example.com');
});

test('buildCaptureDraft forwards description and author from draft to suggestTitle', async () => {
  mockCreatePreview.mockResolvedValue({
    type: 'article', title: 'Titulo', categories: [],
    description: 'Descricao do artigo', author: 'Autor X',
  });
  mockSuggestTitle.mockResolvedValue(null);

  await buildCaptureDraft('https://example.com', 'meu-token');

  expect(mockSuggestTitle).toHaveBeenCalledWith(expect.objectContaining({
    description: 'Descricao do artigo',
    author: 'Autor X',
  }));
});
