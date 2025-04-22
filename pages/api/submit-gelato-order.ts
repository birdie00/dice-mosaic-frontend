// pages/api/submit-gelato-order.ts

import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { session } = req.body;

    if (!session) {
      return res.status(400).json({ error: "Missing Stripe session in request body" });
    }

    const name = session.shipping_details?.name || session.customer_details?.name;
    const email = session.customer_details?.email;
    const address = session.shipping_details?.address;
    const imageUrl = session.metadata?.highResImageUrl;
    const productUid = getProductUidFromMetadata(session.metadata); // defined below

    console.log("📥 Submitting Gelato order with:", { name, email, address, imageUrl, productUid });

    if (!name || !email || !address || !address.line1 || !imageUrl || !productUid) {
      return res.status(400).json({ error: "Missing required order info" });
    }

    const gelatoOrder = {
      recipient: {
        address_line1: address.line1,
        address_city: address.city,
        address_country_code: address.country,
        address_postal_code: address.postal_code,
        address_state: address.state,
        first_name: name.split(" ")[0],
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
const gelatoApiKey = process.env.GELATO_API_KEY!;
const gelatoBearerToken = gelatoApiKey.includes(":")
  ? gelatoApiKey.split(":")[1]
  : gelatoApiKey;

    const gelatoRes = await fetch("https://api.gelato.com/v2/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
    Authorization: `Bearer ${gelatoBearerToken}`, // ✅ Now correct
      },
      body: JSON.stringify(gelatoOrder),
    });

    const result = await gelatoRes.json();

    if (!gelatoRes.ok) {
      console.error("❌ Gelato API error:", result);
      return res.status(500).json({ error: "Failed to create order", details: result });
    }

    console.log("✅ Order placed successfully:", result);
    return res.status(200).json({ success: true, gelatoOrderId: result.id });
  } catch (err: any) {
    console.error("❌ Unexpected error in submit-gelato-order:", err.message);
    return res.status(500).json({ error: "Unexpected error", details: err.message });
  }
}

// 🧠 You can also use this function to determine the product ID
function getProductUidFromMetadata(metadata: any): string | null {
  const aspect = metadata?.printAspectRatio || "portrait";
  const size = metadata?.size || "small";

  const gelatoProductMap: Record<string, Record<string, string>> = {
    portrait: {
      small: "framed_poster_mounted_210x297mm-8x12-inch_black_wood_w12xt22-mm_plexiglass_a4-8x12-inch_200-gsm-80lb-coated-silk_4-0_ver",
      large: "framed_poster_mounted_400x600-mm-16x24-inch_black_wood_w12xt22-mm_plexiglass_400x600-mm-16x24-inch_200-gsm-80lb-coated-silk_4-0_ver",
    },
    square: {
      small: "framed_poster_mounted_300x300-mm-12x12-inch_black_wood_w12xt22-mm_plexiglass_300x300-mm-12x12-inch_200-gsm-80lb-coated-silk_4-0_ver",
      large: "framed_poster_mounted_500x500-mm-20x20-inch_black_wood_w12xt22-mm_plexiglass_500x500-mm-20x20-inch_200-gsm-80lb-coated-silk_4-0_ver",
    },
    landscape: {
      small: "framed_poster_mounted_210x297mm-8x12-inch_black_wood_w12xt22-mm_plexiglass_a4-8x12-inch_200-gsm-80lb-coated-silk_4-0_hor",
      large: "framed_poster_mounted_400x600-mm-16x24-inch_black_wood_w12xt22-mm_plexiglass_400x600-mm-16x24-inch_200-gsm-80lb-coated-silk_4-0_hor",
    },
  };

  return gelatoProductMap[aspect]?.[size] || null;
}
