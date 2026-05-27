import { Server } from 'socket.io';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { prisma } from './db/index.js';
import { publishClient, subscribeClient, redisClient } from './redis/index.js';

let io;
let userSocketMap = new Map();

const SOCKET_EVENTS_CHANNEL = 'socket_events';

const emitToUser = (userId, event, data) => {
    const sockets = userSocketMap.get(userId);
    if (sockets) {
        for (const socketId of sockets) {
            io.to(socketId).emit(event, data);
        }
    }
};

const publishToRedis = async (event, data) => {
    try {
        await publishClient.publish(SOCKET_EVENTS_CHANNEL, JSON.stringify({ event, data }));
    } catch (err) {
        console.error("Failed to publish to Redis:", err);
    }
};

const isUserOnline = async (userId) => {
    const presence = await publishClient.get(`presence:${userId}`);
    return presence === 'online';
};

const handleRedisMessage = (message) => {
    try {
        const { event, data } = JSON.parse(message);

        emitToUser(data.recipientId, event, data);
    } catch (err) {
        console.error("Failed to handle Redis message:", err);
    }
};

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
    });

    subscribeClient.subscribe(SOCKET_EVENTS_CHANNEL);

    subscribeClient.on('message', (channel, message) => {
        handleRedisMessage(message);
    });

    io.use((socket, next) => {
        try {
            const rawCookie = socket.handshake.headers.cookie;

            if (!rawCookie) {
                return next(new Error("No cookies"));
            }

            const parsed = cookie.parse(rawCookie);

            const token = parsed.accessToken; // your cookie name

            if (!token) {
                return next(new Error("No token"));
            }

            const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

            socket.data.userId = payload.id;
            next();
        } catch (err) {
            next(new Error("Authentication error"));
        }
    });

    io.on('connection', async (socket) => {
        const userId = socket.data.userId;
        if (!userSocketMap.has(userId)) {
            userSocketMap.set(userId, new Set());
        }
        userSocketMap.get(userId).add(socket.id);


        // Mark user as online in Redis
        await publishClient.set(`presence:${userId}`, 'online');

        try {
            const undeliveredStatuses = await prisma.messageStatus.findMany({
                where: {
                    userId,
                    status: 'sent'
                },
                include: {
                    message: true
                }
            });

            for (const { message } of undeliveredStatuses) {
                socket.emit('message_received', { message });
            }
        } catch (error) {
            console.error("Error flushing undelivered messages: ", error);
        }


        // handle message read receipts
        socket.on('message_delivered', async ({ messageId }) => {

            try {
                // Verify the message exists and belongs to a conversation the user is part of
                const message = await prisma.message.findFirst({
                    where: {
                        id: messageId,
                        conversation: { members: { some: { userId: userId } } }
                    }
                });
                if (!message) return socket.emit("action_error", { message: "Unauthorized or invalid message ID" });


                // Prevent sender from marking their own message as delivered
                if (message.senderId === userId) return socket.emit("action_error", { message: "Cannot mark your own message as delivered" });


                // Update message status to delivered for the recipient
                await prisma.messageStatus.update({
                    where: { messageId_userId: { messageId, userId } },
                    data: { status: 'delivered' }
                });


                // Notify the sender about the delivery status update
                await publishToRedis("message_delivered_update", {
                    recipientId: message.senderId,
                    messageId,
                    conversationId: message.conversationId,
                    userId
                });

            } catch (error) {
                console.log("Error in message_delivered event: ", error);
            }
        });

        socket.on('message_seen', async ({ messageId }) => {

            try {
                // Verify the message exists and belongs to a conversation the user is part of
                const message = await prisma.message.findFirst({
                    where: {
                        id: messageId,
                        conversation: { members: { some: { userId: userId } } }
                    }
                });
                if (!message) return socket.emit("action_error", { message: "Unauthorized or invalid message ID" });


                // Prevent sender from marking their own message as seen
                if (message.senderId === userId) return socket.emit("action_error", { message: "Cannot mark your own message as seen" });


                // Update message status to seen for the recipient
                await prisma.messageStatus.update({
                    where: { messageId_userId: { messageId, userId } },
                    data: { status: 'seen' }
                });


                // Notify the sender about the seen status update
                await publishToRedis("message_seen_update", {
                    recipientId: message.senderId,
                    messageId,
                    conversationId: message.conversationId,
                    userId
                });
                
                const cacheKey = `conversation:${userId}`;
                await redisClient.del(cacheKey);

            } catch (error) {
                console.error("Error in message_seen event: ", error);
            }
        });


        socket.on('disconnect', async () => {
            const sockets = userSocketMap.get(userId);
            if (sockets) {
                sockets.delete(socket.id);
                if (sockets.size === 0) {
                    userSocketMap.delete(userId);

                    // delete presence key from Redis when user goes offline
                    await publishClient.del(`presence:${userId}`);
                }
            }
        });
    });
}

export { io, initializeSocket, userSocketMap, publishToRedis, isUserOnline };