import 'dotenv/config';
import app from './app.js';
import { createServer } from 'http';
import { initializeSocket } from './socketIo.js';

const httpServer = createServer(app);

initializeSocket(httpServer);
httpServer.listen(process.env.PORT, () => {
  console.log(`Server is running on port ${process.env.PORT}`);
});