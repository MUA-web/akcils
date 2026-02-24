import { startServer } from './src/server.js';

const PORT = process.env.PORT || 3000;

startServer(PORT).catch(err => {
  console.error('❌ Failed to start server:', err);
  process.exit(1);
});
