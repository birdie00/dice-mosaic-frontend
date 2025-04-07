// /pages/api/record-purchase.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { recordPurchase } from '@/lib/recordPurchase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const result = await recordPurchase(req.body);
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("❌ Failed in /api/record-purchase:", err);
    return res.status(400).json({ error: err.message });
  }
}
