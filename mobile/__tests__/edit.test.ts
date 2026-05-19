import { buildEditPayload } from '../src/lib/edit';
import type { Idea } from '../src/lib/types';

const idea = (overrides: Partial<Idea> = {}): Idea => ({
  id: 'id1',
  type: 'article',
  title: 'Titulo original',
  categories: ['Video'],
  createdBy: { uid: 'user1', type: 'human' },
  ...overrides,
});

test('buildEditPayload replaces title when non-empty', () => {
  const payload = buildEditPayload(idea(), { title: 'Novo titulo', categoryText: '', notes: '' });
  expect(payload.title).toBe('Novo titulo');
});

test('buildEditPayload keeps original title when update is empty', () => {
  const payload = buildEditPayload(idea(), { title: '', categoryText: '', notes: '' });
  expect(payload.title).toBe('Titulo original');
});

test('buildEditPayload replaces categories when categoryText is non-empty', () => {
  const payload = buildEditPayload(idea(), { title: '', categoryText: 'Humor, Viagens', notes: '' });
  expect(payload.categories).toEqual(['Humor', 'Viagens']);
});

test('buildEditPayload keeps original categories when categoryText is empty', () => {
  const payload = buildEditPayload(idea({ categories: ['Video'] }), { title: '', categoryText: '', notes: '' });
  expect(payload.categories).toEqual(['Video']);
});

test('buildEditPayload uses notes from updates when non-empty', () => {
  const payload = buildEditPayload(idea(), { title: '', categoryText: '', notes: 'Nova nota' });
  expect(payload.notes).toBe('Nova nota');
});

test('buildEditPayload preserves original notes when update notes is empty', () => {
  const payload = buildEditPayload(idea({ notes: 'Nota original' }), { title: '', categoryText: '', notes: '' });
  expect(payload.notes).toBe('Nota original');
});
