import type { Idea } from './types';

export function canDeleteIdea(idea: Idea, userId: string): boolean {
  return idea.createdBy?.uid === userId;
}
