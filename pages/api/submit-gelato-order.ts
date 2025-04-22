// pages/api/submit-gelato-order.ts

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { name, email, address, imageUrl, productUid } = req.body;

    console.log("📥 Received Gelato order request:", req.body);

    // 🔐 Validate required fields
    if (!name || !email || !imageUrl || !productUid) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!address || !address.line1) {
      return res.status(400).json({ error: "Missing or invalid address from Stripe" });
    }

    const gelatoOrder = {
      recipient: {
        address_line1: address.line1,
        address_city: address.city,
        address_country_code: address.country,
        address_postal_code: address.postal_code,
        address_state: address.state,
        first_name: name.split(" ")[0] || "Customer",
        last_name: name.split(" ").slice(1).join(" ") || "-",
        email,
      },
      items: [
        {
          product_uid: productUid,
          files: [{ url: imageUrl }],
        },
      ],
    };

    console.log("📦 Gelato order payload:", JSON.stringify(gelatoOrder, null, 2));

    const response = await fetch("https://api.gelato.com/v2/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GELATO_API_KEY}`,
      },
      body: JSON.stringify(gelatoOrder),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ Gelato API error:", result);
      return res.status(500).json({ error: "Failed to submit order to Gelato", details: result });
    }

    console.log("✅ Gelato order successfully submitted:", result);
    return res.status(200).json({ success: true, gelatoOrderId: result.id });
  } catch (error: any) {
    console.error("❌ Unexpected error in submit-gelato-order:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
}
