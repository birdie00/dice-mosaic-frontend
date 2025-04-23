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

    console.log("🌐 Sending order to:", "https://order.gelatoapis.com/v2/orders");

    // ✅ Securely extract just the secret token from the API key
    const fullApiKey = process.env.GELATO_SECRET;
    console.log("🔍 Loaded GELATO_SECRET:", fullApiKey);

    if (!fullApiKey) {
      throw new Error("GELATO_SECRET is not defined");
    }

    const gelatoBearerToken = fullApiKey.includes(":")
      ? fullApiKey.split(":")[1]
      : fullApiKey;

    console.log("🛡 Authorization Bearer token being sent:", gelatoBearerToken);

try {
  const gelatoRes = await fetch("https://order.gelatoapis.com/v2/orders", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": gelatoBearerToken,
    },
    body: JSON.stringify(gelatoOrder),
  });

  // First error handling: check the fetch response
  if (!gelatoRes.ok) {
    const result = await gelatoRes.json();
    console.error("❌ Gelato API error:", result);
    return res.status(500).json({ error: "Failed to create order", details: result });
  }

  const result = await gelatoRes.json();
  console.log("✅ Order placed successfully:", result);
  return res.status(200).json({ success: true, gelatoOrderId: result.id });

} catch (err: unknown) {
  // Handle the error if it's an instance of Error
  if (err instanceof Error) {
    console.error("❌ Fetch error:", err);
    return res.status(500).json({ error: "Failed to create order", details: err.message });
  } else {
    console.error("❌ Unexpected error:", err);
    return res.status(500).json({ error: "Unexpected error", details: "An unknown error occurred." });
  }
}


  } catch (err: unknown) {
    // Catch any unknown errors
    if (err instanceof Error) {
      console.error("❌ Error fetching Gelato products:", err);
      return res.status(500).json({ error: "Error fetching products", details: err.message });
    } else {
      console.error("❌ Unexpected error:", err);
      return res.status(500).json({ error: "Unexpected error", details: "An unknown error occurred." });
    }
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
