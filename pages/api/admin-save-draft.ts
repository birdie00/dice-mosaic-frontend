import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";
import { nanoid } from "nanoid";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).end();

  const { grid } = req.body;

  console.log("[admin-save-draft] grid present:", !!grid, Array.isArray(grid) ? `${grid.length}x${grid[0]?.length}` : typeof grid);

  if (!grid) return res.status(400).json({ error: "Missing grid" });

  // Generate a short uppercase code — same format as real purchases so /build can load it
  const code = nanoid(6).toUpperCase();
  const name = `Admin Edit - ${new Date().toISOString()}`;
  const gridDataString = JSON.stringify(grid);

  console.log("[admin-save-draft] inserting into purchases with code:", code, "| grid_data length:", gridDataString.length);

  // Insert into purchases (the table get-grid.ts queries) so the code works in /build
  // stripe_data.metadata.productType = "kit" ensures the productType check in get-grid passes
  const { error } = await supabase.from("purchases").insert([{
    code,
    email: "admin@internal",
    pdf_url: `admin-draft-${Date.now()}`,
    project_name: name,
    stripe_data: JSON.stringify({ metadata: { productType: "kit" } }),
    grid_data: gridDataString,
  }]);

  if (error) {
    console.error("[admin-save-draft] Supabase error:", JSON.stringify(error));
    return res.status(500).json({ error: "Failed to save draft", detail: error.message });
  }

  console.log("[admin-save-draft] insert succeeded, build mode code:", code);
  return res.status(200).json({ id: code, name });
}
