// pages/api/get-grid.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code' });
  }

  const { data, error } = await supabase
    .from('purchases')
    .select('project_name, grid_data')
    .eq('code', code.trim().toUpperCase())
    .single();

  if (error || !data || !data.grid_data) {
    return res.status(404).json({ error: 'Not found' });
  }

  let grid: number[][];
  try {
    grid = JSON.parse(data.grid_data);
  } catch {
    return res.status(500).json({ error: 'Invalid grid data' });
  }

  const rows = grid.length;
  const cols = rows > 0 ? grid[0].length : 0;

  return res.status(200).json({
    projectName: data.project_name,
    rows,
    cols,
    grid,
  });
}
