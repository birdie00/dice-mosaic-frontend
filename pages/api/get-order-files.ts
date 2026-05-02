import type { NextApiRequest, NextApiResponse } from "next";
import { supabase } from "@/lib/supabase";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { session_id } = req.query;

  if (!session_id || typeof session_id !== "string") {
    return res.status(400).json({ error: "Missing session_id" });
  }

  const { data, error } = await supabase
    .from("order_files")
    .select("product_type, high_res_url, low_res_url, pdf_url")
    .eq("session_id", session_id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: "Order files not found" });
  }

  return res.status(200).json(data);
}
