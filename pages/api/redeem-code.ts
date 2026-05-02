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
    .select('pdf_url, stripe_data')
    .eq('email', email.trim().toLowerCase())
    .eq('code', code.trim().toUpperCase()) // Force case match
    .single();

  if (error || !data) {
    console.error("❌ Redeem failed:", error || 'No match found');
    return res.status(404).json({ error: 'Not found' });
  }

  let productType = 'pdf';
  try {
    const stripeData = typeof data.stripe_data === 'string' ? JSON.parse(data.stripe_data) : data.stripe_data;
    productType = stripeData?.metadata?.productType || 'pdf';
  } catch {
    // fallback to pdf
  }

  let stripeData: any;
  try {
    stripeData = typeof data.stripe_data === 'string' ? JSON.parse(data.stripe_data) : data.stripe_data;
  } catch { stripeData = {}; }

  if (productType === 'bundle') {
    const imageUrl = stripeData?.metadata?.highResImageUrl || null;
    return res.status(200).json({ pdfUrl: data.pdf_url, imageUrl, label: 'Download Your High-Res Mosaic Image' });
  }

  if (productType === 'print' || productType === 'highres') {
    const imageUrl = stripeData?.metadata?.highResImageUrl || null;
    return res.status(200).json({ imageUrl, label: 'Download Your High-Res Mosaic Image' });
  }

  if (productType === 'lowres') {
    const imageUrl = stripeData?.metadata?.lowResImageUrl || null;
    return res.status(200).json({ imageUrl, label: 'Download Your Image' });
  }

  return res.status(200).json({ pdfUrl: data.pdf_url });
}
