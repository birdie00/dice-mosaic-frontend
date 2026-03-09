// pages/api/get-grid.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { code } = req.query;
  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Missing code' });
  }

  const normalizedCode = code.trim().toUpperCase();
  console.log('🔍 get-grid received code:', JSON.stringify(code));
  console.log('🔍 get-grid normalized code:', normalizedCode);
  console.log('🔍 Querying purchases WHERE code =', normalizedCode);

  const { data, error } = await supabase
    .from('purchases')
    .select('project_name, grid_data')
    .eq('code', normalizedCode)
    .single();

  console.log('🗄️ Supabase response — error:', JSON.stringify(error));
  console.log('🗄️ Supabase response — data:', JSON.stringify(data));
  console.log('🗄️ grid_data present:', !!data?.grid_data, 'length:', data?.grid_data?.length ?? 0);

  if (error || !data) {
    return res.status(404).json({ error: 'Not found', supabaseError: error?.message });
  }

  if (!data.grid_data) {
    return res.status(404).json({ error: 'No grid data for this code' });
  }

  let grid: number[][];
  try {
    // grid_data may be a pre-parsed array (jsonb column) or a JSON string (text column)
    grid = typeof data.grid_data === 'string'
      ? JSON.parse(data.grid_data)
      : data.grid_data;
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
