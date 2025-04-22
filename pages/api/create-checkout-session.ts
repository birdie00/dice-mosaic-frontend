// pages/api/create-checkout-session.ts

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

    console.log("🔥 create-checkout-session payload:", req.body);

    const metadata: { [key: string]: string } = {
      projectName,
      productType,
      size: size || "",
      pdfUrl: pdfUrl || "",
      lowResImageUrl: lowResImageUrl || "",
      highResImageUrl: highResImageUrl || "",
      styleId: styleId?.toString() || "",
      printAspectRatio: printAspectRatio || "",
    };

    if (grid) {
      metadata.grid = JSON.stringify(grid);
    }

    let unitAmount = 0;
    let productName = "";
    switch (productType) {
      case "pdf":
        unitAmount = 1999;
        productName = "Dice Map PDF";
        break;
      case "highres":
        unitAmount = 1499;
        productName = "High-Resolution Image";
        break;
      case "lowres":
        unitAmount = 499;
        productName = "Basic Resolution Image";
        break;
      case "bundle":
        unitAmount = 2995;
        productName = "Digital Bundle (PDF + High-Res)";
        break;
      case "print":
        productName = "Physical Print";
        unitAmount = size === "large" ? 8999 : 5999;
        break;
      default:
        return res.status(400).json({ error: "Invalid product type" });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unitAmount,
            product_data: {
              name: productName,
              description: `Project: ${projectName}`,
            },
          },
          quantity,
        },
      ],
      customer_email: email,
      metadata,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/create?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/create?canceled=true`,
    });

    return res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("❌ Stripe Checkout Session creation error:", err.message);
    return res.status(500).json({ error: err.message });
  }
}
