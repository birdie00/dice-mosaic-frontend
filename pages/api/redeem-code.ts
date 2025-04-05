// /pages/api/redeem-code.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { email, code } = req.body;

  // 🔍 Debug log
  console.log("🎯 Redeem attempt:", { email, code });

  if (!email || !code) {
    return res.status(400).json({ error: 'Missing email or code' });
  }

  const { data, error } = await supabase
    .from('purchases')
    .select('pdf_url')
    .eq('email', email.trim().toLowerCase())
    .eq('code', code.trim().toUpperCase()) // Force case match
    .single();

  if (error || !data) {
    console.error("❌ Redeem failed:", error || 'No match found');
    return res.status(404).json({ error: 'Not found' });
  }

  return res.status(200).json({ pdfUrl: data.pdf_url });
}
