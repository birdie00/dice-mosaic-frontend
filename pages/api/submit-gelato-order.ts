// pages/api/submit-gelato-order.ts
import type { NextApiRequest, NextApiResponse } from "next";

console.log("📍 THIS IS THE V3 version of submit-gelato-order.ts");

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
    const productUid = getProductUidFromMetadata(session.metadata);

    console.log("📥 Submitting Gelato v3 order with:", { name, email, address, imageUrl, productUid });

    if (!name || !email || !address || !address.line1 || !imageUrl || !productUid) {
      return res.status(400).json({ error: "Missing required order info" });
    }

    const orderPayload = {
      orderReferenceId: session.id,
      customerReferenceId: email,
      currency: "USD",
      items: [
        {
          itemReferenceId: "dice-poster",
          productUid: productUid,
          files: [
            {
              type: "default",
              url: imageUrl,
            },
          ],
          quantity: 1,
        },
      ],
      shippingAddress: {
        firstName: name.split(" ")[0],
        lastName: name.split(" ").slice(1).join(" ") || "-",
        addressLine1: address.line1,
        addressLine2: address.line2 || "",
        city: address.city,
        postCode: address.postal_code,
        state: address.state,
        country: address.country,
        email,
      },
    };

    const apiKey = process.env.GELATO_SECRET;
    if (!apiKey) throw new Error("GELATO_SECRET not found in environment");

    console.log("🌐 Sending v3 order to: https://api.gelato.com/v3/orders");

    const gelatoRes = await fetch("https://api.gelato.com/v3/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": apiKey,
      },
      body: JSON.stringify(orderPayload),
    });

    const result = await gelatoRes.json();

    if (!gelatoRes.ok) {
      console.error("❌ Gelato v3 API error:", result);
      return res.status(500).json({ error: "Failed to create order", details: result });
    }

    console.log("✅ Gelato v3 order placed:", result);
    return res.status(200).json({ success: true, orderId: result.id });

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Error placing Gelato v3 order:", err);
      return res.status(500).json({ error: err.message });
    }
    return res.status(500).json({ error: "Unknown error occurred" });
  }
}

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
