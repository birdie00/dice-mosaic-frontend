import type { NextApiRequest, NextApiResponse } from "next";

const BACKEND_URL = "https://dice-mosaic-backend.onrender.com";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const { grid, styleId, projectName } = req.body;

  if (!grid || !styleId || !projectName) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const response = await fetch(`${BACKEND_URL}/generate-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grid_data: grid,
        style_id: styleId,
        project_name: projectName,
        resolution: "high",
        mode: "dice",
      }),
    });

    const data = await response.json();

    if (!data.image_url) {
      throw new Error("Image generation failed");
    }

    res.status(200).json({ imageUrl: `${BACKEND_URL}${data.image_url}` });
  } catch (error) {
    console.error("High-res image error:", error);
    res.status(500).json({ error: "Failed to generate high-res image." });
  }
}
