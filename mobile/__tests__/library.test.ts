import { scopeIdeas, extractCategories, searchIdeas } from '../src/lib/library';
import type { Idea } from '../src/lib/types';

const idea = (overrides: Partial<Idea>): Idea => ({
  id: 'id1',
  type: 'article',
  title: 'Titulo',
  categories: [],
  createdBy: { uid: 'user1', type: 'human' },
  ...overrides,
});

test('scopeIdeas with mine returns only ideas by that user', () => {
  const ideas = [
    idea({ id: '1', createdBy: { uid: 'user1', type: 'human' } }),
    idea({ id: '2', createdBy: { uid: 'user2', type: 'human' } }),
  ];
  expect(scopeIdeas(ideas, 'mine', 'user1').map(i => i.id)).toEqual(['1']);
});

test('scopeIdeas with all returns every idea', () => {
  const ideas = [
    idea({ id: '1', createdBy: { uid: 'user1', type: 'human' } }),
    idea({ id: '2', createdBy: { uid: 'user2', type: 'human' } }),
  ];
  expect(scopeIdeas(ideas, 'all', 'user1')).toHaveLength(2);
});

test('extractCategories returns sorted unique categories', () => {
  const ideas = [
    idea({ categories: ['Video', 'Humor'] }),
    idea({ categories: ['Viagens', 'Video'] }),
  ];
  expect(extractCategories(ideas)).toEqual(['Humor', 'Viagens', 'Video']);
});

test('extractCategories returns empty array when no ideas have categories', () => {
  expect(extractCategories([idea({ categories: [] })])).toEqual([]);
});

test('searchIdeas with empty query and no category returns all ideas', () => {
  const ideas = [idea({ id: '1' }), idea({ id: '2' })];
  expect(searchIdeas(ideas, '', '')).toHaveLength(2);
});

test('searchIdeas filters to a specific category', () => {
  const ideas = [
    idea({ id: '1', categories: ['Video'] }),
    idea({ id: '2', categories: ['Humor'] }),
  ];
  expect(searchIdeas(ideas, '', 'Video').map(i => i.id)).toEqual(['1']);
});

test('searchIdeas filters by text query across title, description, source', () => {
  const ideas = [
    idea({ id: '1', title: 'Como fazer video viral' }),
    idea({ id: '2', title: 'Receita de bolo', description: 'tutorial de culinaria' }),
    idea({ id: '3', title: 'Noticia', source: 'Jornal Publico' }),
  ];
  expect(searchIdeas(ideas, 'viral', '').map(i => i.id)).toEqual(['1']);
  expect(searchIdeas(ideas, 'culinaria', '').map(i => i.id)).toEqual(['2']);
  expect(searchIdeas(ideas, 'publico', '').map(i => i.id)).toEqual(['3']);
});
