import { parseCategories } from './metadata';
import type { Creator, IdeaDraft } from './types';

type UserInfo = Pick<Creator, 'uid' | 'name' | 'email' | 'photoURL'>;
type IdeaPayload = IdeaDraft & { createdBy: Creator };

export function buildIdeaPayload(
  draft: IdeaDraft | null,
  source: string,
  categoryText: string,
  imageUrl: string | null,
  user: UserInfo,
): IdeaPayload {
  const base: IdeaDraft = draft ?? { type: 'idea', title: source || 'Ideia solta', categories: [] };
  const categories = parseCategories(categoryText);
  const withImage: Partial<IdeaDraft> = imageUrl
    ? { type: 'screenshot', imageUrl, thumbnailUrl: imageUrl }
    : {};
  const title = base.title || source || 'Ideia solta';
  const createdBy: Creator = { ...user, type: 'human' };
  return { ...base, ...withImage, title, categories, createdBy };
}
