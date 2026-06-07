import { kafkaConsumer } from './index.js';
import { handleAvatarCleanupTopic } from './handler.js';
import { AVATAR_CLEANUP_TOPIC } from '../constants.js';


const handleEachMessage = async ({ topic, message }) => {
    switch (topic) {
        case AVATAR_CLEANUP_TOPIC:
            await handleAvatarCleanupTopic({ message });
            break;
        default:
            console.warn(`No handler for topic: ${topic}`);
    }
}

export const startConsumer = async () => {
    await kafkaConsumer.subscribe({ topic: AVATAR_CLEANUP_TOPIC, fromBeginning: false });

    await kafkaConsumer.run({
        eachMessage: handleEachMessage
    });
};