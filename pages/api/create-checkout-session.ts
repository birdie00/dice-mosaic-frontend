import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    const {
      productType,
      size,
      quantity,
      email,
      projectName,
      pdfUrl,
      lowResImageUrl,
      highResImageUrl,
      styleId,
      grid,
      printAspectRatio,
    } = req.body;

  const priceMap: Record<string, string | Record<string, string>> = {
    lowres: "price_1RD2wr2fwLaC6Z6dInNMdCrA",
highres: "price_1RD2wN2fwLaC6Z6dK9ENSJ4s",
    pdf: "price_1RD2xW2fwLaC6Z6dbxHYbwKC",
    bundle: "price_1RD3532fwLaC6Z6d7g5U4D24",
    print: {
      small: "price_1RD3Bp2fwLaC6Z6d69IThiiL",
      medium: "price_1RD3Bp2fwLaC6Z6dnYfjXG6Y",
      large: "price_1RD3Bp2fwLaC6Z6doY27koVI",
    },
  };

  // 🖼 Physical Print
  if (productType === "print") {
    const sizePrices: Record<string, number> = {
      small: 5999,
      large: 8999,
    };

    const unitPrice = sizePrices[size];
    if (!unitPrice) {
      return res.status(400).json({ error: "Invalid print size." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      shipping_address_collection: {
  allowed_countries: [
    "US", // United States
    "CA", // Canada
    "MX", // Mexico
    "AU", // Australia
    "GB", // United Kingdom
    "DE", // Germany
    "FR", // France
    "NL", // Netherlands
    "SE", // Sweden
    "NO", // Norway
    "DK", // Denmark
    "FI", // Finland
    "IE", // Ireland
    "IT", // Italy
    "ES", // Spain
    "BE", // Belgium
    "CH", // Switzerland
    "AT", // Austria
    "NZ", // New Zealand
    "PT", // Portugal
  ],
},
	customer_email: email,
	line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Physical Print (${size})`,
              description: projectName ? `Project: ${projectName}` : undefined,
            },
            unit_amount: unitPrice,
          },
          quantity: Math.max(1, parseInt(quantity)),
        },
      ],
      success_url: `${req.headers.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/create?step=5&canceled=true`,
      metadata: {
        productType,
        size,
        quantity,
        email,
        projectName,
        pdfUrl,
        lowResImageUrl,
        highResImageUrl,
        styleId: styleId?.toString() || "",
        grid: JSON.stringify(grid || []),
	printAspectRatio: printAspectRatio || "portrait",

      },
    });

    return res.status(200).json({ url: session.url });
  }

 
  // 🧾 All Other Products (pdf, lowres, bundle)
  const priceId = priceMap[productType] as string;

  if (!priceId) {
    return res.status(400).json({ error: "Invalid product type or size." });
  }

  try {
   const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 5999, // update based on productType if needed
            product_data: {
              name: `Dice Mosaic: ${projectName}`,
            },
          },
          quantity,
        },
      ],
      metadata: {
        projectName,
        styleId,
        printAspectRatio,
      },
      customer_email: email,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/create?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/create?canceled=true`,
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Stripe session creation failed:", err.message);
    res.status(500).json({ error: err.message });
  }
}
