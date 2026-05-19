import { canDeleteIdea } from '../src/lib/delete';
import type { Idea } from '../src/lib/types';

const idea = (overrides: Partial<Idea> = {}): Idea => ({
  id: 'id1',
  type: 'article',
  title: 'Titulo',
  categories: [],
  createdBy: { uid: 'user1', type: 'human' },
  ...overrides,
});

test('canDeleteIdea returns true when userId matches createdBy.uid', () => {
  expect(canDeleteIdea(idea(), 'user1')).toBe(true);
});

test('canDeleteIdea returns false when userId does not match', () => {
  expect(canDeleteIdea(idea(), 'user2')).toBe(false);
});

test('canDeleteIdea returns false when idea has no createdBy', () => {
  expect(canDeleteIdea(idea({ createdBy: undefined }), 'user1')).toBe(false);
});
