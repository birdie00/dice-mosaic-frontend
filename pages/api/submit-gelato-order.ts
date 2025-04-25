import type { NextApiRequest, NextApiResponse } from "next";

console.log("📍 THIS IS THE FINAL V4 submit-gelato-order.ts");

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

    console.log("📥 Submitting Gelato v4 order with:", { name, email, address, imageUrl, productUid });

    if (!name || !email || !address || !address.line1 || !imageUrl || !productUid) {
      return res.status(400).json({ error: "Missing required order info" });
    }

    const orderPayload = {
      orderType: "order",
      orderReferenceId: session.id,
      customerReferenceId: email,
      currency: "USD",
      items: [
        {
          itemReferenceId: "dice-poster",
          productUid: productUid,
          quantity: 1,
          files: [
            {
              type: "default",
              url: imageUrl,
            }
          ],
        }
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
      metadata: [
        {
          key: "source",
          value: "dice-mosaic",
        },
      ],
    };

    const fullApiKey = process.env.GELATO_SECRET;
    if (!fullApiKey) throw new Error("GELATO_SECRET is not set");

    console.log("🌐 Sending v4 order to: https://order.gelatoapis.com/v4/orders");
    console.log("🔑 Using full key (with colon):", fullApiKey);

    const gelatoRes = await fetch("https://order.gelatoapis.com/v4/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-KEY": fullApiKey,  // ✅ USE ENTIRE KEY INCLUDING COLON
      },
      body: JSON.stringify(orderPayload),
    });

    const result = await gelatoRes.json();

    if (!gelatoRes.ok) {
      console.error("❌ Gelato v4 API error:", result);
      return res.status(500).json({ error: "Failed to create order", details: result });
    }

    console.log("✅ Gelato v4 order placed:", result);
    return res.status(200).json({ success: true, orderId: result.id });

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Error placing Gelato v4 order:", err.message);
      return res.status(500).json({ error: "Failed to create order", details: err.message });
    }
    console.error("❌ Unknown error:", err);
    return res.status(500).json({ error: "Unknown error" });
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
