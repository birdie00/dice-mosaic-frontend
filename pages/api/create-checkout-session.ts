import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  console.log("🔁 Hitting create-checkout-session");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

  if (!stripeSecretKey) {
    console.error("❌ STRIPE_SECRET_KEY is missing!");
    return res.status(500).json({ error: "Stripe key not set in environment." });
  }

  if (!siteUrl) {
    console.error("❌ NEXT_PUBLIC_SITE_URL is missing!");
    return res.status(500).json({ error: "Site URL not configured in environment." });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

  const { projectName } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `Dice Map PDF - ${projectName || "Untitled"}`,
            },
            unit_amount: 500, // in cents ($5.00)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${siteUrl}/create?success=true&project=${encodeURIComponent(
        projectName || ""
      )}`,
      cancel_url: `${siteUrl}/create?canceled=true`,
    });

    console.log("✅ Stripe session created:", session.url);
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("❌ Stripe session error:", err);
    return res.status(500).json({
      error: (err as Error).message || "Stripe session creation failed.",
    });
  }
}
