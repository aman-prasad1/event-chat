import { kafkaConsumer } from './index.js';
import { handleMessageTopic, handleAvatarCleanupTopic } from './handler.js';
import { MESSAGES_TOPIC, AVATAR_CLEANUP_TOPIC } from '../constants.js';


const handleEachMessage = async ({ topic, message }) => {
    switch (topic) {
        case MESSAGES_TOPIC:
            await handleMessageTopic({ message });
            break;
        case AVATAR_CLEANUP_TOPIC:
            await handleAvatarCleanupTopic({ message });
            break;
        default:
            console.warn(`No handler for topic: ${topic}`);
    }
}

export const startConsumer = async () => {
    await kafkaConsumer.subscribe({ topic: MESSAGES_TOPIC, fromBeginning: false });
    await kafkaConsumer.subscribe({ topic: AVATAR_CLEANUP_TOPIC, fromBeginning: false });

    await kafkaConsumer.run({
        eachMessage: handleEachMessage
    });
};