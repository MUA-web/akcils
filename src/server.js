import express from 'express';
import cors from 'cors';
import { PATHS } from './config/paths.js';
import { loadModels } from './lib/faceApi.js';
import faceRoutes from './routes/faceRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import userRoutes from './routes/userRoutes.js';

export async function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.static(PATHS.PUBLIC_DIR));

  app.use(faceRoutes);
  app.use(attendanceRoutes);
  app.use(userRoutes);

  // 404 handler
  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

  await loadModels();

  return app;
}

export async function startServer(port = process.env.PORT || 3000) {
  const app = await createApp();

  return app.listen(port, () => {
    console.log(`\n🚀 Face Attendance API running at http://localhost:${port}\n`);
    console.log('  POST   /register        – Register a face');
    console.log('  POST   /recognize       – Recognize face(s) & mark attendance');
    console.log("  GET    /attendance      – Get today's attendance (?date=YYYY-MM-DD)");
    console.log('  GET    /users           – List registered users');
    console.log('  DELETE /users/:name     – Remove a registered user');
  });
}

