import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { grid } = req.body;

  console.log("[admin-save-draft] received body keys:", Object.keys(req.body));
  console.log("[admin-save-draft] grid present:", !!grid, "| type:", typeof grid);
  if (Array.isArray(grid)) {
    console.log("[admin-save-draft] grid dimensions:", grid.length, "x", grid[0]?.length ?? 0);
  }

  if (!grid) return res.status(400).json({ error: "Missing grid" });

  // Generate the key before insert so we can return it without a read-back
  // (avoids RLS issues with .select().single() on the anon key)
  const draftKey = `admin-draft-${Date.now()}`;
  const name = `Admin Edit - ${new Date().toISOString()}`;
  const gridDataString = JSON.stringify(grid);

  console.log("[admin-save-draft] inserting with pdf_url:", draftKey, "| grid_data length:", gridDataString.length);

  const { error } = await supabase
    .from("grid_drafts")
    .insert({ pdf_url: draftKey, grid_data: gridDataString });

  if (error) {
    console.error("[admin-save-draft] Supabase error:", JSON.stringify(error));
    return res.status(500).json({ error: "Failed to save draft", detail: error.message });
  }

  console.log("[admin-save-draft] insert succeeded, key:", draftKey);
  return res.status(200).json({ id: draftKey, name });
}
