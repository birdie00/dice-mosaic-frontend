import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-03-31.basil", // ✅ match your installed version
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { projectName, pdfUrl, email } = req.body;

  if (!projectName || !pdfUrl || !email) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Determine base domain depending on environment
  const domain =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : "https://dice-mosaic-frontend.vercel.app/"; // 🔁 update with your live domain if different

  try {
    // Log the values being passed to Stripe
    console.log("📦 Creating Stripe session with metadata:", {
      email,
      projectName,
      pdfUrl,
    });

    // Create the Stripe session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: 2500,
            product_data: {
              name: `Dice Map - ${projectName}`,
              images: ["https://pipcasso.com/images/HeaderLogo.png"], // ✅ fallback image
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${domain}/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${domain}/create?cancelled=true`,
      metadata: {
        pdfUrl,
        projectName,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Stripe session creation failed:", error);
    res.status(500).json({ error: "Stripe session creation failed" });
  }
}
