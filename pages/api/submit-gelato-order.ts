import type { NextApiRequest, NextApiResponse } from "next";

console.log("📍 THIS IS THE FINAL V4 submit-gelato-order.ts");

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const { name, email, address, imageUrl, productUid } = req.body;

    console.log("📥 Submitting Gelato v4 order with:", { name, email, address, imageUrl, productUid });

    if (!name || !email || !address || !address.line1 || !imageUrl || !productUid) {
      return res.status(400).json({ error: "Missing required order info", received: { name, email, address, imageUrl, productUid } });
    }

    const orderPayload = {
      orderType: "order",
      orderReferenceId: `pipcasso-${Date.now()}`,
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

