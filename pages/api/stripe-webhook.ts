// pages/api/stripe-webhook.ts

import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});


export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).end("Method Not Allowed");
  }

  const sig = req.headers["stripe-signature"];
  const buf = await buffer(req);

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      buf.toString(),
      sig as string,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("❌ Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.productType === "print") {
      try {
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

        const aspect = session.metadata.printAspectRatio || "portrait";
        const size = session.metadata.size || "small";
        const productUid = gelatoProductMap[aspect]?.[size];

        if (!productUid) {
          console.error("❌ Could not determine Gelato productUid", { aspect, size });
        } else {
          const gelatoRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/submit-gelato-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: session.customer_details?.name,
              email: session.customer_details?.email,
              address: session.customer_details?.address,
              imageUrl: session.metadata.highResImageUrl,
              productUid,
            }),
          });

          if (!gelatoRes.ok) {
            console.error("❌ Gelato order submission failed:", await gelatoRes.text());
          } else {
            const result = await gelatoRes.json();
            console.log("✅ Gelato order submitted. Order ID:", result.orderId);
          }
        }
      } catch (err) {
        console.error("❌ Error calling submit-gelato-order:", err);
      }
    }
  }

  res.status(200).json({ received: true });
}
