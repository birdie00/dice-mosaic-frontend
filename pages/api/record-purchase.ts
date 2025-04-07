// /pages/api/record-purchase.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { nanoid } from 'nanoid';
import { supabase } from '@/lib/supabase';
import sendThankYouEmail from '@/utils/sendThankYouEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, pdfUrl, projectName, stripeData } = req.body;
console.log("📥 Received purchase payload:", req.body);

  if (!email || !pdfUrl || !projectName) {
  console.error("❌ Missing required field(s):", { email, pdfUrl, projectName });
  return res.status(400).json({ error: 'Missing one or more required fields' });
}

  const code = nanoid(6).toUpperCase(); // e.g., "XK49HZ"

  console.log("📦 Recording purchase for:", { email, projectName, pdfUrl });

  // Save purchase info to Supabase
  // 🧪 TEMPORARY BYPASS FOR TESTING
const error = null;
// Comment out the real DB call for now to isolate the issue
// const { error } = await supabase.from('purchases').insert([...]);


  if (error) {
    console.error("❌ Error inserting into Supabase:", error);
    return res.status(500).json({ error: 'Database error' });
  }

  try {
    await sendThankYouEmail({ email, code, pdfUrl, projectName, stripeData });
    console.log("📧 Email sent to:", email, "with code:", code);
  } catch (emailErr) {
    console.error("❌ Failed to send email:", emailErr);
    // Continue, but inform the client
    return res.status(200).json({
      code,
      warning: "Purchase saved, but email failed to send.",
    });
  }

  return res.status(200).json({ code });
}
