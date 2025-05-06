import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil",
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

const {
  productType,
  size,
  kitSize,
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
	highres: "price_1RHoaW2fwLaC6Z6d8BX28zWn",
    	pdf: "price_1RD2xW2fwLaC6Z6dbxHYbwKC",
    	bundle: "price_1RD3532fwLaC6Z6d7g5U4D24",
    	print: {
     	 small: "price_1RD3Bp2fwLaC6Z6d69IThiiL",
    	  medium: "price_1RD3Bp2fwLaC6Z6dnYfjXG6Y",
    	  large: "price_1RD3Bp2fwLaC6Z6doY27koVI",
    },
  };
  if (productType === "kit") {
    const kitPrices: Record<string, number> = {
      "10mm": 59999,
      "8mm": 49999,
    };
  
const unitPrice = kitPrices[kitSize];
    if (!unitPrice) {
      return res.status(400).json({ error: "Invalid kit size." });
    }
  
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      shipping_address_collection: {
        allowed_countries: [
          "US", "CA", "MX", "AU", "GB", "DE", "FR", "NL", "SE", "NO",
          "DK", "FI", "IE", "IT", "ES", "BE", "CH", "AT", "NZ", "PT",
        ],
      },
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unitPrice,
            product_data: {
name: `DIY Dice Kit (${kitSize})`,
              description: "Includes dice, frame, and personalized Dice Map",
            },
          },
          quantity: Math.max(1, parseInt(quantity)),
        },
      ],
      success_url: `${req.headers.origin}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/store?canceled=true`,
      metadata: {
        productType,
        kitSize,
        quantity,
        email,
      },
    });
  
    return res.status(200).json({ url: session.url });
  }
  
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
          "US", "CA", "MX", "AU", "GB", "DE", "FR", "NL", "SE", "NO",
          "DK", "FI", "IE", "IT", "ES", "BE", "CH", "AT", "NZ", "PT"
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
