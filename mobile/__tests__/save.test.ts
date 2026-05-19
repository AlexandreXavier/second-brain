import { buildIdeaPayload } from '../src/lib/save';
import type { IdeaDraft } from '../src/lib/types';

const user = { uid: 'user1', name: 'Alex Xavier', email: 'alex@test.com', photoURL: null };

const draft = (overrides: Partial<IdeaDraft> = {}): IdeaDraft => ({
  type: 'article',
  title: 'Artigo interessante',
  categories: [],
  ...overrides,
});

test('buildIdeaPayload with no draft creates loose idea from source', () => {
  const payload = buildIdeaPayload(null, 'Ideia sobre marketing', '', null, user);
  expect(payload.type).toBe('idea');
  expect(payload.title).toBe('Ideia sobre marketing');
});

test('buildIdeaPayload with no draft and no source falls back to Ideia solta', () => {
  const payload = buildIdeaPayload(null, '', '', null, user);
  expect(payload.title).toBe('Ideia solta');
});

test('buildIdeaPayload applies parsed categories from categoryText', () => {
  const payload = buildIdeaPayload(draft({ categories: ['Antigo'] }), '', 'Video, Humor', null, user);
  expect(payload.categories).toEqual(['Video', 'Humor']);
});

test('buildIdeaPayload with imageUrl sets type to screenshot and both image fields', () => {
  const payload = buildIdeaPayload(draft(), '', '', 'https://storage.example/img.jpg', user);
  expect(payload.type).toBe('screenshot');
  expect(payload.imageUrl).toBe('https://storage.example/img.jpg');
  expect(payload.thumbnailUrl).toBe('https://storage.example/img.jpg');
});

test('buildIdeaPayload uses source as title fallback when draft title is empty', () => {
  const payload = buildIdeaPayload(draft({ title: '' }), 'https://youtube.com/watch?v=abc', '', null, user);
  expect(payload.title).toBe('https://youtube.com/watch?v=abc');
});

test('buildIdeaPayload sets createdBy from user with type human', () => {
  const payload = buildIdeaPayload(draft(), '', '', null, user);
  expect(payload.createdBy).toEqual({
    uid: 'user1', name: 'Alex Xavier', email: 'alex@test.com', photoURL: null, type: 'human',
  });
});
