import "dotenv/config";
import app from "./app.js";
import { connectKafka } from "./kafka/index.js";
import { startConsumer } from "./kafka/consumer.js";

const startServer = async () => {
  try {
    await connectKafka();
    await startConsumer();

    app.listen(process.env.PORT, () => {
      console.log(`User service is running on port ${process.env.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
  }
};

startServer();