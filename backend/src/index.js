import 'dotenv/config';
import app from './app.js';
import { createServer } from 'http';
import { initializeSocket } from './socketIo.js';
import { connectKafka } from './kafka/index.js';
import { startConsumer } from './kafka/consumer.js';

const httpServer = createServer(app);

initializeSocket(httpServer);
httpServer.listen(process.env.PORT, async () => {

  // start kafka services
  await connectKafka();
  await startConsumer();

  console.log(`Server is running on port ${process.env.PORT}`);
});