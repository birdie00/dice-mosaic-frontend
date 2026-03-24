import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { grid } = req.body;
  if (!grid) return res.status(400).json({ error: "Missing grid" });

  const name = `Admin Edit - ${new Date().toISOString()}`;

  const { data, error } = await supabase
    .from("grid_drafts")
    .insert({ pdf_url: `admin-draft-${Date.now()}`, grid_data: JSON.stringify(grid) })
    .select("id, pdf_url")
    .single();

  if (error) {
    console.error("admin-save-draft error:", error);
    return res.status(500).json({ error: "Failed to save draft" });
  }

  return res.status(200).json({ id: data.id, name });
}
