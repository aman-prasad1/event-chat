import { kafkaConsumer } from './index.js';
import { handleMessageTopic } from './handler.js';
import { MESSAGES_TOPIC } from '../constants.js';


const handleEachMessage = async ({ topic, message }) => {
    switch (topic) {
        case MESSAGES_TOPIC:
            await handleMessageTopic({ message });
            break;
        default:
            console.warn(`No handler for topic: ${topic}`);
    }
}

export const startConsumer = async () => {
    await kafkaConsumer.subscribe({ topic: MESSAGES_TOPIC, fromBeginning: false });

    await kafkaConsumer.run({
        eachMessage: handleEachMessage
    });
};