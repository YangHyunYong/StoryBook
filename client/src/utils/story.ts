import { supabase } from "./supabaseClient";
import type { StoryBook } from "../types/story";

/** Supabase 데이터를 StoryBook 타입으로 변환 */
function mapStoryData(data: any): StoryBook {
  return {
    id: Number(data.id),
    parentId: data.parent_id ? Number(data.parent_id) : null,
    title: data.title,
    author: data.author,
    content: data.content,
    imageUrl: data.image_url || undefined,
    timestamp: Number(data.timestamp),
  };
}

/** id로 Story 하나 찾기 */
export async function findStoryById(id: number): Promise<StoryBook | undefined> {
  if (!supabase) {
    console.error("Supabase client is not configured");
    return undefined;
  }

  try {
    const { data, error } = await supabase
      .from("story")
      .select("id, parent_id, title, author, content, image_url, timestamp")
      .eq("id", id)
      .single();

    if (error || !data) {
      console.error("Failed to fetch story:", error);
      return undefined;
    }

    return mapStoryData(data);
  } catch (err) {
    console.error("Error fetching story:", err);
    return undefined;
  }
}

/** 특정 Story에서 직접 파생된 자식들 */
export async function findChildrenStories(
  parentId: number
): Promise<StoryBook[]> {
  if (!supabase) {
    console.error("Supabase client is not configured");
    return [];
  }

  try {
    const { data, error } = await supabase
      .from("story")
      .select("id, parent_id, title, author, content, image_url, timestamp")
      .eq("parent_id", parentId)
      .order("timestamp", { ascending: false });

    if (error) {
      console.error("Failed to fetch children stories:", error);
      return [];
    }

    return (data || []).map(mapStoryData);
  } catch (err) {
    console.error("Error fetching children stories:", err);
    return [];
  }
}

/** 부모 Story 찾기 (루트면 undefined) */
export async function findParentStoryById(
  id: number
): Promise<StoryBook | undefined> {
  const story = await findStoryById(id);
  if (!story || story.parentId == null) return undefined;
  return findStoryById(story.parentId);
}
