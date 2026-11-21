import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Connect database or initialize fallback local storage
  await connectDB();

  app.listen(PORT, () => {
    console.log(`=======================================================`);
    console.log(`  KAAMSETU Backend API running on port ${PORT}`);
    console.log(`  Health & Demo info: http://localhost:${PORT}/api/health`);
    console.log(`  Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=======================================================`);
  });
};

startServer();
