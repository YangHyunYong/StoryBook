import { Router, Request, Response } from "express";
import { supabase, PostRecord } from "../supabaseClient";

const router = Router();
const TABLE = "posts";

function generateId(): string {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

router.get("/", async (req: Request, res: Response) => {
  const limit = Number(req.query.limit ?? 50);

  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(Number.isFinite(limit) && limit > 0 ? limit : 50);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  return res.json({ posts: data });
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: "Post not found" });
  }
  return res.json({
    post: data,
  });
});

router.post("/", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const id: string = generateId();
  const userId = String(req.header("x-user-id") ?? "").trim();
  const content: string =
    typeof body.content === "string" ? body.content.trim() : "";
  const timestamp: number = Date.now();
  const likes: number = 0;
  const reposts: number = 0;

  if (!userId || !content) {
    return res
      .status(400)
      .json({ error: "x-user-id header and content are required" });
  }

  // verify user exists
  const { data: user, error: userError } = await supabase
    .from("users")
    .select("id, nickname")
    .eq("id", userId)
    .maybeSingle();
  if (userError) {
    return res.status(500).json({ error: userError.message });
  }
  if (!user) {
    return res.status(403).json({ error: "User not found" });
  }

  const record: PostRecord = {
    id,
    user_id: userId,
    content,
    timestamp,
    likes,
    reposts,
    nickname: (user as any)?.nickname,
  };
  const { error } = await supabase.from(TABLE).insert(record);

  if (error) {
    return res.status(500).json({ error: error.message });
  }
  // fetch with join to include latest nickname
  const { data: created, error: fetchCreatedError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchCreatedError) {
    return res.status(500).json({ error: fetchCreatedError.message });
  }
  return res
    .status(201)
    .json({ post: created });
});

// legacy delta likes route removed (use PUT/DELETE /posts/likes or POST /posts/likes)

// legacy delta reposts route removed (use PUT/DELETE /posts/reposts or POST /posts/reposts)

function getUserId(req: Request): string {
  return String(req.header("x-user-id") ?? "").trim();
}

// User-scoped interactions now supported via POST toggle endpoints only

// Toggle like: first tap -> like, second tap -> unlike
router.post("/:id/likes", async (req: Request, res: Response) => {
  const id = req.params.id;
  const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: "x-user-id header is required" });
  }

  // Validate existence of post and user to disambiguate errors
  const { data: postExists, error: postCheckError } = await supabase
    .from(TABLE)
    .select("id")
    .eq("id", id)
    .maybeSingle();
  if (postCheckError) {
    return res.status(500).json({ error: postCheckError.message });
  }
  const { data: userExists, error: userCheckError } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();
  if (userCheckError) {
    return res.status(500).json({ error: userCheckError.message });
  }
  if (!postExists || !userExists) {
    const reasons = [];
    if (!postExists) reasons.push("Post not found");
    if (!userExists) reasons.push("User not found");
    return res.status(404).json({ error: reasons.join(" and ") });
  }

  const { data: existing, error: checkError } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (checkError) {
    return res.status(500).json({ error: checkError.message });
  }

  if (existing) {
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", id)
      .eq("user_id", userId);
    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }
  } else {
    const { error: insertError } = await supabase
      .from("likes")
      .insert({ post_id: id, user_id: userId });
    if (insertError) {
      if ((insertError as any).code?.includes?.("23503")) {
        return res.status(404).json({ error: "Post not found" });
      }
      if ((insertError as any).code?.includes?.("23505")) {
        // race: treat as already liked by someone else process; ignore
      } else {
        return res.status(500).json({ error: insertError.message });
      }
    }
  }

  const { data: post, error: fetchError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const { data: likedRow } = await supabase
    .from("likes")
    .select("post_id")
    .eq("post_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  return res.json({
    post: post,
    liked: Boolean(likedRow),
  });
});

// Toggle repost: first tap -> repost, second tap -> unrepost
router.post("/:id/reposts", async (req: Request, res: Response) => {
  const id = req.params.id;
  const userId = getUserId(req);
  if (!userId) {
    return res.status(400).json({ error: "x-user-id header is required" });
  }

  // Validate existence of post and user to disambiguate errors
  const { data: parentPost, error: postCheckError } = await supabase
    .from(TABLE)
    .select("id, content, depth")
    .eq("id", id)
    .maybeSingle();
  if (postCheckError) {
    return res.status(500).json({ error: postCheckError.message });
  }
  const { data: userExists, error: userCheckError } = await supabase
    .from("users")
    .select("id, nickname")
    .eq("id", userId)
    .maybeSingle();
  if (userCheckError) {
    return res.status(500).json({ error: userCheckError.message });
  }
  if (!parentPost || !userExists) {
    const reasons = [];
    if (!parentPost) reasons.push("Post not found");
    if (!userExists) reasons.push("User not found");
    return res.status(404).json({ error: reasons.join(" and ") });
  }

  const { data: existing, error: checkError } = await supabase
    .from("reposts")
    .select("post_id")
    .eq("post_id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (checkError) {
    return res.status(500).json({ error: checkError.message });
  }

  let createdRepostId: string | undefined;
  if (existing) {
    // Remove per-user repost marker
    const { error: deleteError } = await supabase
      .from("reposts")
      .delete()
      .eq("post_id", id)
      .eq("user_id", userId);
    if (deleteError) {
      return res.status(500).json({ error: deleteError.message });
    }
    // Remove user's repost post(s) derived from this parent
    const { error: deletePostError } = await supabase
      .from(TABLE)
      .delete()
      .eq("parent_post_id", id)
      .eq("user_id", userId)
      .eq("is_repost", true);
    if (deletePostError) {
      return res.status(500).json({ error: deletePostError.message });
    }
  } else {
    // Add per-user repost marker
    const { error: insertError } = await supabase
      .from("reposts")
      .insert({ post_id: id, user_id: userId });
    if (insertError) {
      if ((insertError as any).code?.includes?.("23503")) {
        return res.status(404).json({ error: "Post not found" });
      }
      if ((insertError as any).code?.includes?.("23505")) {
        // race: already inserted elsewhere; ignore
      } else {
        return res.status(500).json({ error: insertError.message });
      }
    }
    // Create a repost as a new post row
    createdRepostId = generateId();
    const repostRecord: PostRecord = {
      id: createdRepostId,
      user_id: userId,
      content: (parentPost as any).content as string,
      timestamp: Date.now(),
      likes: 0,
      reposts: 0,
      is_repost: true,
      depth: (Number((parentPost as any).depth) || 0) + 1,
      parent_post_id: id,
      nickname: (userExists as any)?.nickname,
    };
    const { error: insertPostError } = await supabase
      .from(TABLE)
      .insert(repostRecord);
    if (insertPostError) {
      return res.status(500).json({ error: insertPostError.message });
    }
  }

  const { data: post, error: fetchError } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fetchError) {
    return res.status(500).json({ error: fetchError.message });
  }
  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  const { data: repostRow } = await supabase
    .from("reposts")
    .select("post_id")
    .eq("post_id", id)
    .eq("user_id", userId)
    .maybeSingle();

  return res.json({
    post: post,
    reposted: Boolean(repostRow),
    repost_id: createdRepostId,
  });
});

export default router;
