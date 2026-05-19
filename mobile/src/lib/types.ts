import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

type Timestamp = FirebaseFirestoreTypes.Timestamp;

export type IdeaType = 'youtube' | 'tweet' | 'instagram' | 'article' | 'screenshot' | 'idea';

export type Creator = {
  uid?: string;
  name?: string | null;
  email?: string | null;
  photoURL?: string | null;
  type?: 'human' | 'agent';
  tokenPreview?: string;
};

export type Idea = {
  id: string;
  type: IdeaType;
  url?: string;
  title: string;
  source?: string;
  sourceName?: string;
  author?: string;
  description?: string;
  previewText?: string;
  thumbnailUrl?: string;
  imageUrl?: string;
  categories: string[];
  filmDate?: string;
  notes?: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
  createdBy?: Creator;
};

export type IdeaDraft = Omit<Idea, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>;
