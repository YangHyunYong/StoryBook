export type StoryBook = {
  id: number;
  parentId?: number | null;
  title: string;
  author: string;
  content: string;
  imageUrl?: string;
  timestamp: number;
};
