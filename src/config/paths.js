import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root is two levels up from src/config
const ROOT_DIR = path.resolve(__dirname, '../..');

export const PATHS = {
  ROOT_DIR,
  MODELS_DIR: path.join(ROOT_DIR, 'models'),
  PUBLIC_DIR: path.join(ROOT_DIR, 'public'),
  DATABASE_DIR: path.join(ROOT_DIR, 'database'),
  FACES_DB: path.join(ROOT_DIR, 'database', 'faces.json'),
  ATTEND_DB: path.join(ROOT_DIR, 'database', 'attendance.json'),
  MODEL_BASE_URL: 'https://vladmandic.github.io/face-api/model/',
};

