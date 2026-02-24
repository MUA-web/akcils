import { Router } from 'express';
import { PATHS } from '../config/paths.js';
import { readDB, writeDB } from '../lib/db.js';
import { supabase } from '../config/supabaseClient.js';

const router = Router();

// GET /users
router.get('/users', async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('faces')
      .select('name, registration_number, department, level, registered_at, updated_at')
      .order('registered_at', { ascending: false });

    if (error) throw new Error(error.message);

    const formattedUsers = users.map(u => ({
      name: u.name,
      registrationNumber: u.registration_number,
      department: u.department,
      level: u.level,
      registeredAt: u.registered_at,
      updatedAt: u.updated_at || null,
    }));

    return res.json({ count: formattedUsers.length, users: formattedUsers });
  } catch (err) {
    console.error('❌ /users error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// DELETE /users/:registrationNumber
router.delete('/users/:registrationNumber', async (req, res) => {
  try {
    const regNum = decodeURIComponent(req.params.registrationNumber).trim();

    // First check if user exists to return friendly name in message
    const { data: user, error: fetchError } = await supabase
      .from('faces')
      .select('name')
      .eq('registration_number', regNum)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      return res.status(404).json({ error: `User with Reg No "${regNum}" not found` });
    } else if (fetchError) {
      throw new Error(fetchError.message);
    }

    const { error: deleteError } = await supabase
      .from('faces')
      .delete()
      .eq('registration_number', regNum);

    if (deleteError) throw new Error(deleteError.message);

    return res.json({ success: true, message: `Removed "${user.name}"` });
  } catch (err) {
    console.error('❌ /users/:registrationNumber error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router;

