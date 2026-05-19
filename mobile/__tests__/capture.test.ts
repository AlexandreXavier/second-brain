import { buildCaptureDraft } from '../src/lib/capture';
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
