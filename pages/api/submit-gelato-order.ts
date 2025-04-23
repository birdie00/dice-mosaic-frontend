import type { NextApiRequest, NextApiResponse } from "next";

console.log("📍 THIS IS THE LATEST submit-gelato-order.ts");

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
      orderType: "order",  // Default value for an order
      orderReferenceId: session.id,  // Stripe session ID as the order reference
      customerReferenceId: session.customer_email,  // Use Stripe's customer email as the reference ID
      currency: "USD",  // The currency of the order (e.g., "USD")
      items: [
        {
          itemReferenceId: "item_001",  // Unique item ID or SKU
          productUid: session.metadata?.productUid,  // Product UID from Stripe session metadata
          quantity: 1,  // Quantity of the product
          files: [
            {
              type: "default",  // Default print type
              url: session.metadata?.highResImageUrl,  // File URL for printing
            }
          ]
        }
      ],
      shippingAddress: {
        firstName: session.shipping_details?.name.split(" ")[0],
        lastName: session.shipping_details?.name.split(" ")[1] || "-", 
        addressLine1: session.shipping_details?.address.line1,
        addressLine2: session.shipping_details?.address.line2 || "",
        city: session.shipping_details?.address.city,
        postCode: session.shipping_details?.address.postal_code,
        state: session.shipping_details?.address.state,
        country: session.shipping_details?.address.country,
        email: session.customer_details?.email, 
      },
      metadata: [
        {
          key: "keyIdentifier1",
          value: "keyValue1"
        },
        {
          key: "keyIdentifier2",
          value: "keyValue2"
        }
      ]
    };

    console.log("🌐 Sending order to:", "https://order.gelatoapis.com/v4/orders");

    const fullApiKey = process.env.GELATO_SECRET;
    console.log("🔍 Loaded GELATO_SECRET:", fullApiKey);

    if (!fullApiKey) {
      throw new Error("GELATO_SECRET is not defined");
    }

    const gelatoBearerToken = process.env.GELATO_SECRET;
console.log("🛡 Authorization Bearer token being sent:", gelatoBearerToken);

const gelatoRes = await fetch("https://order.gelatoapis.com/v4/orders", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": gelatoBearerToken,  // This is the secret key from Vercel's env variable
  },
  body: JSON.stringify(gelatoOrder),
});


    if (!gelatoRes.ok) {
      const result = await gelatoRes.json();
      console.error("❌ Gelato API error:", result);
      return res.status(500).json({ error: "Failed to create order", details: result });
    }

    const result = await gelatoRes.json();
    console.log("✅ Order placed successfully:", result);
    return res.status(200).json({ success: true, gelatoOrderId: result.id });

  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Fetch error:", err);
      return res.status(500).json({ error: "Failed to create order", details: err.message });
    } else {
      console.error("❌ Unexpected error:", err);
      return res.status(500).json({ error: "Unexpected error", details: "An unknown error occurred." });
    }
  }
}

// 🧠 Function to determine the product ID based on metadata
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
