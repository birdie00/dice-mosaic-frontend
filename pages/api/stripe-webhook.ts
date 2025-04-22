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

    try {
      const gelatoRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/submit-gelato-order`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ session }),
});


      if (!gelatoRes.ok) {
        console.error("❌ Gelato order submission failed:", await gelatoRes.text());
      } else {
        console.log("✅ Gelato order submitted successfully.");
      }
    } catch (err) {
      console.error("❌ Error calling submit-gelato-order:", err);
    }
  }

  res.status(200).json({ received: true });
}
