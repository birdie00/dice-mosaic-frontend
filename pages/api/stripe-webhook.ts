// pages/api/stripe-webhook.ts

import { buffer } from "micro";
import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { Resend } from "resend";
import { supabase } from "@/lib/supabase";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendOwnerNotification({
  customerName,
  customerEmail,
  amountTotal,
  productType,
  address,
  gelatoFailed,
}: {
  customerName: string | null | undefined;
  customerEmail: string | null | undefined;
  amountTotal: number | null;
  productType: string;
  address: Stripe.Address | null | undefined;
  gelatoFailed?: boolean;
}) {
  const amount = amountTotal != null ? `$${(amountTotal / 100).toFixed(2)}` : "N/A";

  const addressLines =
    productType === "print" && address
      ? [
          address.line1,
          address.line2,
          `${address.city}, ${address.state} ${address.postal_code}`,
          address.country,
        ]
          .filter(Boolean)
          .join("\n")
      : null;

  const gelatoNote = gelatoFailed
    ? "\n⚠️ Gelato order failed — manual fulfillment needed"
    : "";

  const body = [
    `Customer: ${customerName || "Unknown"}`,
    `Email: ${customerEmail || "Unknown"}`,
    `Amount: ${amount}`,
    `Product type: ${productType}`,
    addressLines ? `Shipping address:\n${addressLines}` : null,
    gelatoNote || null,
  ]
    .filter(Boolean)
    .join("\n");

  await resend.emails.send({
    from: "Pipcasso <noreply@pipcasso.com>",
    to: "jacob@kokomoandco.com",
    subject: `🎲 New Pipcasso Order — ${productType}`,
    text: body,
  });
}

async function sendGelatoFailureAlert({
  customerName,
  customerEmail,
  amountTotal,
  address,
  errorMessage,
}: {
  customerName: string | null | undefined;
  customerEmail: string | null | undefined;
  amountTotal: number | null;
  address: Stripe.Address | null | undefined;
  errorMessage: string;
}) {
  const amount = amountTotal != null ? `$${(amountTotal / 100).toFixed(2)}` : "N/A";

  const addressLines = address
    ? [
        address.line1,
        address.line2,
        `${address.city}, ${address.state} ${address.postal_code}`,
        address.country,
      ]
        .filter(Boolean)
        .join("\n")
    : "N/A";

  const body = [
    `Customer: ${customerName || "Unknown"}`,
    `Email: ${customerEmail || "Unknown"}`,
    `Amount: ${amount}`,
    `Shipping address:\n${addressLines}`,
    `Error: ${errorMessage}`,
  ].join("\n");

  await resend.emails.send({
    from: "Pipcasso <noreply@pipcasso.com>",
    to: "jacob@kokomoandco.com",
    subject: "⚠️ Gelato Order Failed — Manual Action Needed",
    text: body,
  });
}

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
    const productType = session.metadata?.productType || "unknown";

    await supabase.from("order_files").upsert({
      session_id: session.id,
      product_type: productType,
      high_res_url: session.metadata?.highResImageUrl || null,
      low_res_url: session.metadata?.lowResImageUrl || null,
      pdf_url: session.metadata?.pdfUrl || null,
      email: session.customer_details?.email || session.metadata?.email || null,
    }, { onConflict: "session_id" });

    let gelatoFailed = false;
    let gelatoErrorMessage = "";

    if (productType === "print") {
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

        const aspect = session.metadata!.printAspectRatio || "portrait";
        const size = session.metadata!.size || "small";
        const productUid = gelatoProductMap[aspect]?.[size];

        if (!productUid) {
          gelatoErrorMessage = `Could not determine Gelato productUid (aspect: ${aspect}, size: ${size})`;
          console.error("❌", gelatoErrorMessage);
          gelatoFailed = true;
        } else {
          const gelatoRes = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/submit-gelato-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: session.customer_details?.name,
              email: session.customer_details?.email,
              address: session.customer_details?.address,
              imageUrl: session.metadata!.highResImageUrl,
              productUid,
            }),
          });

          if (!gelatoRes.ok) {
            gelatoErrorMessage = await gelatoRes.text();
            console.error("❌ Gelato order submission failed:", gelatoErrorMessage);
            gelatoFailed = true;
          } else {
            const result = await gelatoRes.json();
            console.log("✅ Gelato order submitted. Order ID:", result.orderId);
          }
        }
      } catch (err: any) {
        gelatoErrorMessage = err?.message || String(err);
        console.error("❌ Error calling submit-gelato-order:", err);
        gelatoFailed = true;
      }

      if (gelatoFailed) {
        try {
          await sendGelatoFailureAlert({
            customerName: session.customer_details?.name,
            customerEmail: session.customer_details?.email,
            amountTotal: session.amount_total,
            address: session.customer_details?.address,
            errorMessage: gelatoErrorMessage,
          });
          console.log("✅ Gelato failure alert sent.");
        } catch (err) {
          console.error("❌ Failed to send Gelato failure alert:", err);
        }
      }
    }

    try {
      await sendOwnerNotification({
        customerName: session.customer_details?.name,
        customerEmail: session.customer_details?.email,
        amountTotal: session.amount_total,
        productType,
        address: productType === "print" ? session.customer_details?.address : null,
        gelatoFailed: productType === "print" ? gelatoFailed : undefined,
      });
      console.log("✅ Owner notification sent.");
    } catch (err) {
      console.error("❌ Failed to send owner notification:", err);
    }
  }

  res.status(200).json({ received: true });
}
