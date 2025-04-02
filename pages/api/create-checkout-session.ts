import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

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
            unit_amount: 500, // Amount in cents ($5.00)
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/create?success=true&project=${encodeURIComponent(projectName)}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/create?canceled=true`,
    });

    res.status(200).json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe checkout session error:", err.message);
    res.status(500).json({ error: err.message });
  }
}
