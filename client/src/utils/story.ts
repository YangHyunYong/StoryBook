import type { StoryBook } from "../types/story";
import { stories } from "../mocks/stories";

/** id로 Story 하나 찾기 */
export function findStoryById(id: number): StoryBook | undefined {
  return stories.find((s) => s.id === id);
}

/** 특정 Story에서 직접 파생된 자식들 */
export function findChildrenStories(parentId: number): StoryBook[] {
  return stories.filter((s) => s.parentId === parentId);
}

/** 부모 Story 찾기 (루트면 undefined) */
export function findParentStoryById(id: number): StoryBook | undefined {
  const story = findStoryById(id);
  if (!story || story.parentId == null) return undefined;
  return findStoryById(story.parentId);
}
