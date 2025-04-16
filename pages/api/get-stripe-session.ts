import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { recordPurchase } from '@/lib/recordPurchase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { session_id } = req.query;
  console.log("🔍 Received session_id:", session_id);

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid session_id' });
  }

  try {
	const session = await stripe.checkout.sessions.retrieve(session_id, {
 	 expand: ["customer_details"],
	});
    console.log("🧾 Full Stripe session:", session);

    const metadata = session.metadata || {};
    const email = metadata.email;
    const pdfUrl = metadata.pdfUrl;
    const projectName = metadata.projectName;

    if (!email || !pdfUrl || !projectName) {
      console.warn("⚠️ Missing required metadata fields.");
      return res.status(400).json({ error: "Missing required metadata fields." });
    }

    const result = await recordPurchase({
      email,
      projectName,
      pdfUrl,
      stripeData: session,
    });

    return res.status(200).json({
      metadata: session.metadata,
      pdfUrl,
      code: result.code,
      ...(result.warning && { warning: result.warning }),
    });
  } catch (err: any) {
    console.error('❌ Error in get-stripe-session:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
