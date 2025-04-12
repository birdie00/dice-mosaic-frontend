import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

const { productType, size, quantity = 1, email, projectName, pdfUrl } = req.body;

  // ✅ Your real price IDs from Stripe
  const priceMap: Record<string, string | Record<string, string>> = {
    highres: "price_1RD2wN2fwLaC6Z6dK9ENSJ4s",
    lowres: "price_1RD2wr2fwLaC6Z6dInNMdCrA",
    pdf: "price_1RD2xW2fwLaC6Z6dbxHYbwKC",
    bundle: "price_1RD3532fwLaC6Z6d7g5U4D24",
    print: {
      small: "price_1RD3Bp2fwLaC6Z6d69IThiiL",
      medium: "price_1RD3Bp2fwLaC6Z6dnYfjXG6Y",
      large: "price_1RD3Bp2fwLaC6Z6doY27koVI",
    },
  };

  let priceId: string | undefined;

  if (productType === "print") {
    if (!size || typeof size !== "string") {
      return res.status(400).json({ error: "Missing or invalid print size." });
    }

    priceId = (priceMap.print as Record<string, string>)[size];
  } else {
    priceId = priceMap[productType] as string;
  }

  if (!priceId) {
    return res.status(400).json({ error: "Invalid product type or size." });
  }

try {
  console.log("Creating Stripe Checkout session with:", {
    productType,
    size,
    quantity,
    email,
    projectName,
    pdfUrl,
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price: priceId,
        quantity: Math.max(1, parseInt(quantity)),
      },
    ],
    success_url: `${req.headers.origin}/create?success=true`,
    cancel_url: `${req.headers.origin}/create?canceled=true`,
    metadata: {
      productType,
      size,
      quantity,
      email,
      projectName,
      pdfUrl,
    },
  });

  return res.status(200).json({ url: session.url });
} catch (err) {
  console.error("Stripe session error:", err);
  return res.status(500).json({ error: "Stripe session creation failed." });
}
