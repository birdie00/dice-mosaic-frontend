// /pages/api/get-stripe-session.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { session_id } = req.query;

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);

    const metadata = session.metadata || {};
    const email = metadata.email;
    const pdfUrl = metadata.pdfUrl;
if (!pdfUrl) {
  console.warn("⚠️ Warning: pdfUrl is missing from Stripe session metadata.");
}

    const projectName = metadata.projectName;

    console.log('📦 Stripe session metadata:', metadata);

    // 🔧 Call record-purchase and get the code
    const recordRes = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/record-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        projectName,
        pdfUrl,
        stripeData: session,
      }),
    });

    const recordData = await recordRes.json();

    if (!recordRes.ok) {
      console.error('❌ Failed to record purchase:', recordData);
      return res.status(500).json({ error: 'Failed to save purchase info' });
    }

    return res.status(200).json({
  metadata,
  pdfUrl, // ✅ makes frontend simpler
  code: recordData.code,
});

  } catch (err) {
    console.error('❌ Error retrieving Stripe session:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
