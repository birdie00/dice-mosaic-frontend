import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const { pdfUrl, gridData } = req.body;
  if (!pdfUrl || !gridData) {
    return res.status(400).json({ error: 'Missing pdfUrl or gridData' });
  }

  const { error } = await supabase
    .from('grid_drafts')
    .upsert({ pdf_url: pdfUrl, grid_data: gridData });

  if (error) {
    console.error('❌ Error saving grid draft:', error);
    return res.status(500).json({ error: 'Failed to save grid draft' });
  }

  return res.status(200).json({ ok: true });
}
