import { Server } from 'socket.io';
import cookie from 'cookie';
import jwt from 'jsonwebtoken';
import { prisma } from './db/index.js';

let io;
let userSocketMap = new Map();

const initializeSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: process.env.CORS_ORIGIN,
            credentials: true
        }
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

    io.on('connection', (socket) => {
        const userId = socket.data.userId;
        userSocketMap.set(userId, socket.id);


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
                const messageStatus = await prisma.messageStatus.update({
                    where: { messageId_userId: { messageId, userId } },
                    data: { status: 'delivered' }
                });


                // Notify the sender about the delivery status update
                const senderSocket = userSocketMap.get(message.senderId);
                if (senderSocket) {
                    io.to(senderSocket).emit("message_delivered_update", {
                        messageId,
                        conversationId: message.conversationId,
                        userId
                    });
                }
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
                const messageStatus = await prisma.messageStatus.update({
                    where: { messageId_userId: { messageId, userId } },
                    data: { status: 'seen' }
                });
    
    
                // Notify the sender about the seen status update
                const senderSocket = userSocketMap.get(message.senderId);
                if (senderSocket) {
                    io.to(senderSocket).emit("message_seen_update", {
                        messageId,
                        conversationId: message.conversationId,
                        userId
                    });
                }
            } catch (error) {
                console.error("Error in message_seen event: ", error);
            }
        });


        socket.on('disconnect', () => {
            userSocketMap.delete(userId);
        });
    });
}

export { io, initializeSocket, userSocketMap };