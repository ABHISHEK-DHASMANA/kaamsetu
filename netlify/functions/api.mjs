import serverless from 'serverless-http';
import app from '../../server/src/app.js';
import { connectDB } from '../../server/src/config/db.js';

let isConnected = false;

const init = async () => {
  if (!isConnected) {
    await connectDB();
    isConnected = true;
  }
};

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  await init();
  return await serverlessHandler(event, context);
};
