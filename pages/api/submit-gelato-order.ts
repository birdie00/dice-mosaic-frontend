// pages/api/submit-gelato-order.ts

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { session } = req.body;

    if (!session) {
      return res.status(400).json({ error: "Missing Stripe session" });
    }

    const address = session.shipping_details?.address;
    const name = session.shipping_details?.name || session.customer_details?.name;
    const email = session.customer_details?.email;
    const imageUrl = session.metadata?.highResImageUrl;
    const productUid = req.body.productUid || "MISSING_PRODUCT_UID"; // You may already map this earlier

    console.log("📥 Parsed Gelato Order Data:", { name, email, address, imageUrl, productUid });

    if (!address || !address.line1) {
      return res.status(400).json({ error: "Invalid address from session" });
    }

    if (!imageUrl || !productUid) {
      return res.status(400).json({ error: "Missing imageUrl or productUid" });
    }

    const gelatoOrder = {
      recipient: {
        address_line1: address.line1,
        address_city: address.city,
        address_country_code: address.country,
        address_postal_code: address.postal_code,
        address_state: address.state,
        first_name: name?.split(" ")[0] || "Customer",
        last_name: name?.split(" ").slice(1).join(" ") || "-",
        email,
      },
      items: [
        {
          product_uid: productUid,
          files: [{ url: imageUrl }],
        },
      ],
    };

    console.log("📦 Sending to Gelato:", JSON.stringify(gelatoOrder, null, 2));

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
      console.error("❌ Gelato Error:", result);
      return res.status(500).json({ error: "Failed to create Gelato order", details: result });
    }

    console.log("✅ Gelato Order Success:", result);
    return res.status(200).json({ success: true, gelatoOrderId: result.id });
  } catch (err: any) {
    console.error("❌ Unexpected error in submit-gelato-order:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
