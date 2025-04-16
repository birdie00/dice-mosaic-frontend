// pages/api/submit-gelato-order.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { name, email, address, imageUrl, productUid } = req.body;

  try {
    const response = await fetch("https://api.gelato.com/v3/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": process.env.GELATO_API_KEY!,
      },
      body: JSON.stringify({
        order_type: "Express",
        customer_reference: `order-${Date.now()}`,
        recipient: {
          address_line1: address.line1,
          city: address.city,
          country: address.country,
          name,
          zip: address.postalCode,
          email,
        },
        items: [
          {
            item_reference: "mosaic-print",
            product_uid: productUid,
            quantity: 1,
            files: [{ url: imageUrl }],
          },
        ],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gelato error:", data);
      return res.status(500).json({ error: "Gelato order failed", detail: data });
    }

    return res.status(200).json({ message: "Gelato order submitted", data });
  } catch (err) {
    console.error("Gelato order error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
}
