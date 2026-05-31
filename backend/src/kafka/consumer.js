import { kafkaConsumer } from './index.js';
import { prisma } from '../db/index.js';
import { publishToRedis, isUserOnline } from '../socketIo.js';
import { redisClient } from '../redis/index.js';

const MESSAGES_TOPIC = 'messages';

export const startConsumer = async () => {
    await kafkaConsumer.subscribe({ topic: MESSAGES_TOPIC, fromBeginning: false });

    await kafkaConsumer.run({
        eachMessage: async ({ message }) => {
            try {
                const { conversationId, senderId, content, type, members } = JSON.parse(message.value.toString());

                // save message to DB
                const savedMessage = await prisma.message.create({
                    data: {
                        conversationId,
                        senderId,
                        content,
                        type
                    }
                });

                // create message status + notify each member
                await Promise.all(
                    members
                        .filter(m => m.userId !== senderId)
                        .map(async (m) => {
                            await prisma.messageStatus.create({
                                data: {
                                    messageId: savedMessage.id,
                                    userId: m.userId,
                                    status: 'sent'
                                }
                            });

                            // publish to Redis if recipient is online
                            const online = await isUserOnline(m.userId);
                            if (online) {
                                await publishToRedis('message_received', {
                                    recipientId: m.userId,
                                    message: savedMessage
                                });
                            }
                        })
                );

                // invalidate conversation cache for all members
                await Promise.all(
                    members.map(m =>
                        redisClient.del(`conversation:${m.userId}`)
                    )
                );

            } catch (error) {
                console.error('Error processing message:', error);
                throw error;
            }
        }
    });
};