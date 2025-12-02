import dotenv from "dotenv";
// import { createClient } from "@supabase/supabase-js";

dotenv.config();

// const supabaseUrl = process.env.SUPABASE_URL;
// const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// if (!supabaseUrl || !supabaseServiceRoleKey) {
//   console.error(
//     "[supabase] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Exiting."
//   );
//   // Fail fast to avoid creating client with invalid config
//   process.exit(1);
// }

// export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
//   auth: {
//     persistSession: false,
//     autoRefreshToken: false,
//   },
// });

// Supabase 사용 안 함 - 주석처리
export const supabase: any = null;

export type PostRecord = {
  id: string;
  user_id: string;
  content: string;
  timestamp: number;
  reposts: number;
  likes: number;
  is_repost?: boolean;
  depth?: number;
  parent_post_id?: string | null;
  nickname?: string;
};
