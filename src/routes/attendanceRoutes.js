import { Router } from 'express';
import { supabase } from '../config/supabaseClient.js';

const router = Router();

function today() {
  return new Date().toISOString().split('T')[0];
}

// GET /attendance?date=YYYY-MM-DD
router.get('/attendance', async (req, res) => {
  try {
    const date = req.query.date || today();

    const { data: records, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', date);

    if (error) throw error;

    return res.json({ date, count: records.length, records });
  } catch (err) {
    console.error('❌ /attendance error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router;

