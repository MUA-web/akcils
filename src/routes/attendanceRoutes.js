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

// GET /attendance/student/:regNumber
router.get('/attendance/student/:regNumber', async (req, res) => {
  try {
    const { regNumber } = req.params;

    // 1. Find the student name from the 'faces' table
    const { data: student, error: studentError } = await supabase
      .from('faces')
      .select('name, registration_number, department, level')
      .eq('registration_number', regNumber)
      .single();

    if (studentError) {
      if (studentError.code === 'PGRST116') {
        return res.status(404).json({ error: 'Student count not found' });
      }
      throw studentError;
    }

    // 2. Find attendance records for that name
    const { data: records, error: attendError } = await supabase
      .from('attendance')
      .select('*')
      .eq('name', student.name)
      .order('date', { ascending: false });

    if (attendError) throw attendError;

    return res.json({
      student,
      count: records.length,
      records
    });
  } catch (err) {
    console.error('❌ /attendance/student/:regNumber error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router;

