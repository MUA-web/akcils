import { Router } from 'express';
import multer from 'multer';
import { PATHS } from '../config/paths.js';
import { readDB, writeDB } from '../lib/db.js';
import { faceapi, loadImage, detectFace } from '../lib/faceApi.js';
import { supabase } from '../config/supabaseClient.js';

const router = Router();

// Multer (in-memory storage) for image uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  },
});

function today() {
  return new Date().toISOString().split('T')[0];
}

router.post('/register', upload.single('image'), async (req, res) => {
  try {
    const { name, registrationNumber, department, level } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!registrationNumber?.trim()) return res.status(400).json({ error: 'Registration Number is required' });
    if (!department?.trim()) return res.status(400).json({ error: 'Department is required' });
    if (!level?.trim()) return res.status(400).json({ error: 'Level is required' });
    if (!req.file) return res.status(400).json({ error: 'Image is required' });

    const img = await loadImage(req.file.buffer);
    const detections = await detectFace(img);

    if (detections.length === 0) {
      return res.status(400).json({ error: 'No face detected in the image' });
    }
    if (detections.length > 1) {
      return res.status(400).json({
        error: `Multiple faces detected (${detections.length}). Please upload a single-face image.`,
      });
    }

    const descriptorArray = Array.from(detections[0].descriptor);

    // Check if user with registrationNumber exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('faces')
      .select('id, registration_number')
      .eq('registration_number', registrationNumber.trim())
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 means no rows found
      console.error("Supabase fetch error:", fetchError);
      throw new Error(fetchError.message);
    }

    if (existingUser) {
      // Update existing record
      const { error: updateError } = await supabase
        .from('faces')
        .update({
          name: name.trim(),
          department: department.trim(),
          level: level.trim(),
          descriptor: descriptorArray,
          updated_at: new Date().toISOString()
        })
        .eq('registration_number', registrationNumber.trim());

      if (updateError) throw new Error(updateError.message);
    } else {
      // Insert new record
      const { error: insertError } = await supabase
        .from('faces')
        .insert([{
          name: name.trim(),
          registration_number: registrationNumber.trim(),
          department: department.trim(),
          level: level.trim(),
          descriptor: descriptorArray
        }]);

      if (insertError) throw new Error(insertError.message);
    }

    return res.json({
      success: true,
      message: existingUser ? `Updated face for "${name}"` : `Registered "${name}" successfully`,
    });
  } catch (err) {
    console.error('❌ /register error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// POST /recognize
router.post('/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Image is required' });

    const { course_code, department, level } = req.body;

    const { data: faces, error: fetchError } = await supabase
      .from('faces')
      .select('name, registration_number, department, level, descriptor');

    if (fetchError) throw new Error(fetchError.message);

    if (!faces || faces.length === 0) {
      return res.status(404).json({ error: 'No registered users. Please register faces first.' });
    }

    const img = await loadImage(req.file.buffer);
    const detections = await detectFace(img);

    if (detections.length === 0) {
      return res.status(400).json({ error: 'No face detected in the image' });
    }

    const labeledDescriptors = faces.map(
      f => new faceapi.LabeledFaceDescriptors(f.registration_number, [new Float32Array(f.descriptor)]),
    );
    const matcher = new faceapi.FaceMatcher(labeledDescriptors, 0.45); // Standardized threshold
    const results = [];
    const attendanceLogs = [];

    for (const detection of detections) {
      const match = matcher.findBestMatch(detection.descriptor);

      if (match.label === 'unknown') {
        results.push({ recognized: false, label: 'Unknown Visitor' });
        continue;
      }

      // Find the full student record for this registration number
      const student = faces.find(f => f.registration_number === match.label);
      if (!student) continue;

      results.push({
        recognized: true,
        name: student.name,
        registration_number: student.registration_number,
        department: student.department,
        level: student.level,
        distance: parseFloat(match.distance.toFixed(4))
      });

      attendanceLogs.push({
        name: student.name,
        date: today(),
        course_code: course_code || null,
        department: student.department || department || null,
        level: student.level || level || null
      });
    }

    if (attendanceLogs.length > 0) {
      const { error: attendError } = await supabase
        .from('attendance')
        .insert(attendanceLogs);

      if (attendError) {
        console.error('❌ Supabase attendance log error:', attendError);
        // We don't necessarily want to fail the whole request if just logging failed, 
        // but for a strict attendance app, we might. Let's just log it for now.
      }
    }

    return res.json({ recognized: results });
  } catch (err) {
    console.error('❌ /recognize error:', err);
    return res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

export default router;

