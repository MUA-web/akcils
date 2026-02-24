import * as canvas from 'canvas';
import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';
import { PATHS } from '../config/paths.js';

// Canvas & CJS require shim
const { Canvas, Image, ImageData, loadImage, createCanvas } = canvas;
const require = createRequire(import.meta.url);
const faceapi = require('@vladmandic/face-api/dist/face-api.node-wasm.js');

// Patch face-api to use node-canvas
faceapi.env.monkeyPatch({ Canvas, Image, ImageData, createCanvas, loadImage });

async function ensureModelFiles(manifestFile) {
  if (!fs.existsSync(PATHS.MODELS_DIR)) {
    fs.mkdirSync(PATHS.MODELS_DIR, { recursive: true });
  }

  const manifestPath = path.join(PATHS.MODELS_DIR, manifestFile);
  if (!fs.existsSync(manifestPath)) {
    const res = await fetch(`${PATHS.MODEL_BASE_URL}${manifestFile}`);
    if (!res.ok) {
      throw new Error(`Failed to download ${manifestFile}: ${res.status} ${res.statusText}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(manifestPath, buf);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const paths = manifest.flatMap(m => m?.paths || []);

  for (const p of paths) {
    const filePath = path.join(PATHS.MODELS_DIR, p);
    if (fs.existsSync(filePath)) continue;

    const res = await fetch(`${PATHS.MODEL_BASE_URL}${p}`);
    if (!res.ok) {
      throw new Error(`Failed to download ${p}: ${res.status} ${res.statusText}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(filePath, buf);
  }
}

export async function loadModels() {
  try {
    console.log('⏳ Loading face-api models...');
    await faceapi.tf.ready();

    // Download missing weight files automatically (first run)
    const manifests = [
      'ssd_mobilenetv1_model-weights_manifest.json',
      'face_landmark_68_model-weights_manifest.json',
      'face_recognition_model-weights_manifest.json'
    ];

    for (const m of manifests) {
      console.log(`📥 Ensuring model: ${m}`);
      await ensureModelFiles(m);
    }

    console.log('📂 Loading from disk:', PATHS.MODELS_DIR);
    await faceapi.nets.ssdMobilenetv1.loadFromDisk(PATHS.MODELS_DIR);
    await faceapi.nets.faceLandmark68Net.loadFromDisk(PATHS.MODELS_DIR);
    await faceapi.nets.faceRecognitionNet.loadFromDisk(PATHS.MODELS_DIR);

    console.log('✅ Models loaded successfully.');
  } catch (err) {
    console.error('❌ CRITICAL ERROR during model loading:', err);
    // Rethrow to allow server startup to fail visibly
    throw err;
  }
}

export async function detectFace(img) {
  console.log(`🔍 Detecting face in image: ${img.width}x${img.height}`);
  const detections = await faceapi
    .detectAllFaces(img, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 }))
    .withFaceLandmarks()
    .withFaceDescriptors();

  console.log(`📊 Found ${detections.length} face(s).`);
  return detections;
}

export { faceapi, loadImage };

