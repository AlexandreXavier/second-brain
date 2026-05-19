import { scopeIdeas, extractCategories, searchIdeas, sortIdeas } from '../src/lib/library';
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

test('scopeIdeas with mine excludes ideas where createdBy is absent', () => {
  const ideas = [
    idea({ id: '1', createdBy: { uid: 'user1', type: 'human' } }),
    idea({ id: '2', createdBy: undefined }),
  ];
  expect(scopeIdeas(ideas, 'mine', 'user1').map(i => i.id)).toEqual(['1']);
});

test('scopeIdeas with all includes ideas even when createdBy is absent', () => {
  const ideas = [
    idea({ id: '1', createdBy: { uid: 'user1', type: 'human' } }),
    idea({ id: '2', createdBy: undefined }),
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

const ts = (iso: string) => ({ toDate: () => new Date(iso) });

test('sortIdeas with newest returns most recent first', () => {
  const ideas = [
    idea({ id: '1', createdAt: ts('2026-01-01') as any }),
    idea({ id: '2', createdAt: ts('2026-03-01') as any }),
    idea({ id: '3', createdAt: ts('2026-02-01') as any }),
  ];
  expect(sortIdeas(ideas, 'newest').map(i => i.id)).toEqual(['2', '3', '1']);
});

test('sortIdeas with oldest returns earliest first', () => {
  const ideas = [
    idea({ id: '1', createdAt: ts('2026-03-01') as any }),
    idea({ id: '2', createdAt: ts('2026-01-01') as any }),
  ];
  expect(sortIdeas(ideas, 'oldest').map(i => i.id)).toEqual(['2', '1']);
});

test('sortIdeas with alpha sorts by title A to Z', () => {
  const ideas = [
    idea({ id: '1', title: 'Zebra' }),
    idea({ id: '2', title: 'Abacate' }),
    idea({ id: '3', title: 'Mango' }),
  ];
  expect(sortIdeas(ideas, 'alpha').map(i => i.id)).toEqual(['2', '3', '1']);
});

test('searchIdeas with category and text query returns ideas matching both', () => {
  const ideas = [
    idea({ id: '1', title: 'Video viral', categories: ['Video'] }),
    idea({ id: '2', title: 'Video viral', categories: ['Humor'] }),
    idea({ id: '3', title: 'Outro tema', categories: ['Video'] }),
  ];
  expect(searchIdeas(ideas, 'viral', 'Video').map(i => i.id)).toEqual(['1']);
});

test('searchIdeas excludes idea whose text matches but category does not', () => {
  const ideas = [
    idea({ id: '1', title: 'Video viral', categories: ['Humor'] }),
  ];
  expect(searchIdeas(ideas, 'viral', 'Video')).toHaveLength(0);
});

test('searchIdeas finds idea when query matches author', () => {
  const ideas = [
    idea({ id: '1', author: 'Canal Criativo' }),
    idea({ id: '2', author: 'Outro Canal' }),
  ];
  expect(searchIdeas(ideas, 'criativo', '').map(i => i.id)).toEqual(['1']);
});

test('searchIdeas returns empty when query matches no field including author', () => {
  const ideas = [idea({ id: '1', title: 'Video', author: 'Canal X' })];
  expect(searchIdeas(ideas, 'inexistente', '')).toHaveLength(0);
});

test('sortIdeas pushes ideas without createdAt to the end for newest and oldest', () => {
  const ideas = [
    idea({ id: '1', createdAt: ts('2026-01-01') as any }),
    idea({ id: '2' }),
  ];
  expect(sortIdeas(ideas, 'newest').map(i => i.id)).toEqual(['1', '2']);
  expect(sortIdeas(ideas, 'oldest').map(i => i.id)).toEqual(['2', '1']);
});
