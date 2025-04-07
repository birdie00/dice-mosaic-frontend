// /pages/api/get-stripe-session.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { session_id } = req.query;
console.log("🔍 Received session_id:", session_id);

  if (!session_id || typeof session_id !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid session_id' });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(session_id);
console.log("🧾 Full Stripe session:", session);

    const metadata = session.metadata || {};
    const email = metadata.email;
    const pdfUrl = metadata.pdfUrl;
if (!pdfUrl) {
  console.warn("⚠️ Warning: pdfUrl is missing from Stripe session metadata.");
  return res.status(400).json({ error: "Missing PDF URL in session metadata." });
}


    const projectName = metadata.projectName;

    console.log('📦 Stripe session metadata:', metadata);

try {
  const recordRes = await fetch(`https://dice-mosaic-frontend.vercel.app/api/record-purchase`, {
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
    metadata: session.metadata,
    pdfUrl,
    code: recordData.code,
  });
} catch (err) {
  console.error('❌ record-purchase call failed:', err);
  return res.status(500).json({ error: 'record-purchase fetch failed' });
}
