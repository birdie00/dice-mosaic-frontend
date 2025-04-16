import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

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
  } = req.body;

  const priceMap: Record<string, string | Record<string, string>> = {
    lowres: "price_1RD2wr2fwLaC6Z6dInNMdCrA",
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
      small: 4999,
      medium: 7999,
      large: 9999,
    };

    const unitPrice = sizePrices[size];
    if (!unitPrice) {
      return res.status(400).json({ error: "Invalid print size." });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
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
      },
    });

    return res.status(200).json({ url: session.url });
  }

  // 🧠 High-Res Image
  if (productType === "highres") {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "High Quality Mosaic Image",
            },
            unit_amount: 1499,
          },
          quantity: quantity || 1,
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
      line_items: [
        {
          price: priceId,
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
      },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("Stripe session error:", err);
    return res.status(500).json({ error: "Stripe session creation failed." });
  }
}
