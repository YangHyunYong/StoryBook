import { Router, Request, Response } from "express";
import { supabase } from "../supabaseClient";
import { generateId, getUserIdFromHeader } from "../utils";

const router = Router();
const TABLE = "users";

// GET by id from header
router.get("/", async (req: Request, res: Response) => {
  const id = getUserIdFromHeader(req);
  if (!id) {
    return res.status(400).json({ error: "x-user-id header is required" });
  }
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) {
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ user: data });
});

router.post("/", async (req: Request, res: Response) => {
  const body = req.body ?? {};
  const id: string =
    typeof body.id === "string" && body.id.trim() ? body.id : generateId();
  const wallet_address: string =
    typeof body.wallet_address === "string" ? body.wallet_address.trim() : "";
  const nickname: string =
    typeof body.nickname === "string" ? body.nickname.trim() : "";
  const avatar_url: string | undefined =
    typeof body.avatar_url === "string" && body.avatar_url.trim()
      ? body.avatar_url.trim()
      : undefined;

  if (!wallet_address || !nickname) {
    return res
      .status(400)
      .json({ error: "wallet_address and nickname are required" });
  }

  const record = { id, wallet_address, nickname, avatar_url };
  const { data, error } = await supabase
    .from(TABLE)
    .insert(record)
    .select()
    .maybeSingle();

  if (error) {
    // Unique violation
    if ((error as any).code?.includes?.("23505")) {
      return res
        .status(409)
        .json({ error: "User already exists (wallet_address or id conflict)" });
    }
    return res.status(500).json({ error: error.message });
  }

  return res.status(201).json({ user: data ?? record });
});

router.patch("/", async (req: Request, res: Response) => {
  const id = getUserIdFromHeader(req);
  if (!id) {
    return res.status(400).json({ error: "x-user-id header is required" });
  }
  const body = req.body ?? {};
  const updates: Record<string, unknown> = {};

  if (typeof body.nickname === "string") {
    const nickname = body.nickname.trim();
    if (!nickname)
      return res.status(400).json({ error: "nickname cannot be empty" });
    updates.nickname = nickname;
  }
  if (typeof body.avatar_url === "string") {
    const avatar_url = body.avatar_url.trim();
    updates.avatar_url = avatar_url || null;
  }
  // wallet_address 업데이트는 기본적으로 고정하는 편이 안전하지만, 필요 시 아래 주석 해제
  // if (typeof body.wallet_address === "string") {
  //   const wallet_address = body.wallet_address.trim();
  //   if (!wallet_address) return res.status(400).json({ error: "wallet_address cannot be empty" });
  //   updates.wallet_address = wallet_address;
  // }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: "No updatable fields provided" });
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) {
    if ((error as any).code?.includes?.("23505")) {
      return res
        .status(409)
        .json({ error: "Conflicts with existing user (unique constraint)" });
    }
    return res.status(500).json({ error: error.message });
  }
  if (!data) {
    return res.status(404).json({ error: "User not found" });
  }
  return res.json({ user: data });
});

export default router;
