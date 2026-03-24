import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email } = req.body;
  if (!email || typeof email !== "string" || !email.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Pipcasso <noreply@pipcasso.com>",
        to: "jacob@kokomoandco.com",
        subject: "New Commission Inquiry",
        text: `Someone is interested in a commission. Their email: ${email.trim()}`,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("Resend error:", error);
      return res.status(500).json({ error: "Failed to send email" });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Commission inquiry error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
