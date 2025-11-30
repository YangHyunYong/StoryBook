export interface Post {
  id: string;
  nickname: string;
  content: string;
  timestamp: number;
  reposts: number;
  likes: number;
}

export interface ThreadPost {
  id: string;
  parentId: string;
  nickname: string;
  content: string;
  timestamp: number;
  reposts: number;
  likes: number;
}
