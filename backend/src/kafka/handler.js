import { prisma } from '../db/index.js';
import { publishToRedis, isUserOnline } from '../socketIo.js';
import { redisClient } from '../redis/index.js';
import { deleteFromCloudinary } from '../utils/cloudinary.js';


const handleMessageTopic = async ({ message }) => {
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
        const createdStatuses = await Promise.all(
            members
                .filter(m => m.userId !== senderId)
                .map(async (m) => {
                    const statusRecord = await prisma.messageStatus.create({
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
                            message: {
                                ...savedMessage,
                                statuses: [statusRecord]
                            }
                        });
                    }
                    return statusRecord;
                })
        );

        // Notify the sender that the message is successfully saved
        const senderOnline = await isUserOnline(senderId);
        if (senderOnline) {
            console.log(senderId);
            await publishToRedis('message_sent', {
                recipientId: senderId,
                message: {
                    ...savedMessage,
                    statuses: createdStatuses
                }
            });
        }

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


const handleAvatarCleanupTopic = async ({ message }) => {
    try {
        const { avatar_key } = JSON.parse(message.value.toString());

        // delete avatar from cloudinary
        await deleteFromCloudinary(avatar_key);
    } catch (error) {
        console.error('Error processing avatar cleanup:', error);
        throw error;
    }
}

export {
    handleMessageTopic,
    handleAvatarCleanupTopic
}