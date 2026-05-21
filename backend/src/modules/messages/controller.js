import { prisma } from '../../db/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { uploadToS3 } from '../../utils/s3.js';
import { io, isUserOnline, publishToRedis } from '../../socketIo.js';
import fs from 'fs';

const createDirectConversation = asyncHandler(async (req, res) => {
    try {
        // id of the user to start a conversation with
        const { userId } = req.body;

        // 2nd user cannot be the same as the logged in user
        if (req.user.id === userId) {
            throw new ApiError(400, 'Cannot create a conversation with yourself');
        }

        // check if conversation already exists
        const existing = await prisma.conversation.findFirst({
            where: {
                type: "direct",
                members: {
                    every: {
                        userId: { in: [req.user.id, userId] }
                    }
                }
            },
            include: {
                members: true
            }
        });

        // check if the existing conversation has exactly 2 members (the logged in user and the other user)
        if (existing && existing.members.length === 2) {
            res
                .status(200)
                .json(new ApiResponse(200, 'Direct conversation already exists', { "conversationId": existing.id, "type": "direct" }));
            return;
        }

        // if conversation does not exist, create a new one
        const conversation = await prisma.conversation.create({
            data: {
                type: "direct",
                members: {
                    create: [
                        { userId: req.user.id },
                        { userId }
                    ]
                }
            }
        });

        res
            .status(201)
            .json(new ApiResponse(201, 'Direct conversation created successfully', { "conversationId": conversation.id, "type": "direct" }));

    } catch (error) {
        // if userId does not exist in the database, prisma will throw a foreign key constraint error with code P2003
        if (error.code === 'P2003') {
            throw new ApiError(404, 'User not found');
        }

        throw new ApiError(error.statusCode || 500, error.message || 'Failed to create direct conversation');
    }
});


const getConverstionMessages = asyncHandler(async (req, res) => {

    try {
        const { conversationId } = req.params;

        // check if the conversation exists and the user is a member of it
        const isMember = await prisma.conversationMember.findFirst({
            where: {
                conversationId,
                userId: req.user.id
            }
        });
        if (!isMember) {
            throw new ApiError(403, 'You are not a member of this conversation');
        }


        // fetch messages with pagination (20 messages per page) and return the next cursor for pagination
        const messages = await prisma.message.findMany({
            where: { conversationId },
            orderBy: { createdAt: 'desc' },
            take: parseInt(req.query.limit) || 20,
            ...(req.query.cursor && {
                cursor: { id: req.query.cursor },
                skip: 1
            })
        });

        res
            .status(200)
            .json(new ApiResponse(200, 'Messages fetched successfully', { "messages": messages, "nextCursor": messages.length > 0 ? messages[messages.length - 1].id : null }));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to fetch conversation messages');
    }

});

const createConversationMessage = asyncHandler(async (req, res) => {
    try {
        const { conversationId, content, type } = req.body;

        // Membership validation
        const member = await prisma.conversationMember.findFirst({
            where: {
                conversationId,
                userId: req.user.id
            }
        });
        if (!member) {
            throw new ApiError(403, 'You are not a member of this conversation');
        }

        let parsedContent;

        // Handle message types
        if (type === 'text') {
            if (req.file) {
                throw new ApiError(400, 'File should not be included for text messages');
            }

            try {
                parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
            } catch (error) {
                throw new ApiError(400, 'Invalid content format for text message');
            }

            if (
                typeof parsedContent !== 'object' ||
                typeof parsedContent.text !== 'string' ||
                parsedContent.text.trim() === ''
            ) {
                throw new ApiError(400, 'Text content must be a non-empty string');
            }
        } else if (type === 'file') {
            if (!req.file) {
                throw new ApiError(400, 'File is required for file messages');
            }

            // upload file to S3
            const fileKey = await uploadToS3(req.file);
            if (!fileKey) {
                throw new ApiError(500, 'Failed to upload file');
            }

            parsedContent = {
                filename: req.file.originalname,
                file_key: fileKey,
                mimetype: req.file.mimetype,
                size: req.file.size
            };

            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error('Error deleting local file:', err);
                }
            });
        } else {
            throw new ApiError(400, 'Unsupported message type');
        }

        const message = await prisma.message.create({
            data: {
                conversationId,
                senderId: req.user.id,
                content: parsedContent,
                type
            }
        });

        const members = await prisma.conversationMember.findMany({
            where: { conversationId },
            select: { userId: true }
        });

        await Promise.all(
            members
                .filter(m => m.userId !== req.user.id)
                .map(async (m) => {
                    await prisma.messageStatus.create({
                        data: {
                            messageId: message.id,
                            userId: m.userId,
                            status: 'sent'
                        }
                    });

                    const online = await isUserOnline(m.userId);
                    if (online) {
                        await publishToRedis("message_received", {
                            recipientId: m.userId,
                            message
                        });
                    }
                })
        );

        res
            .status(201)
            .json(new ApiResponse(201, 'Message sent successfully', { "messageId": message.id }));
    } catch (error) {
        if (req.file) {
            // Ensure that the local file is deleted after processing
            fs.unlink(req.file.path, (err) => {
                if (err) {
                    console.error('Error deleting local file:', err);
                }
            });
        }

        if (error.code === "P2003") {
            throw new ApiError(404, 'Conversation not found');
        }

        throw new ApiError(error.statusCode || 500, error.message || 'Failed to send message');
    }
});

const getRecentConversations = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?.id;

        const conversations = await prisma.conversation.findMany({
            where: {
                members: {
                    some: { userId }
                }
            },
            include: {
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: {
                        id: true,
                        senderId: true,
                        type: true,
                        content: true,
                        createdAt: true
                    }
                },
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                username: true,
                                first_name: true,
                                last_name: true,
                                avatar_url: true
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        if (conversations.length === 0) {
            return res
                .status(200)
                .json(new ApiResponse(200, 'No conversations found', { conversations: [] }));
        }

        // get unread counts for all conversations
        const unreadCounts = await prisma.messageStatus.groupBy({
            by: ['messageId'],
            where: {
                userId,
                status: {
                    in: ['sent', 'delivered']
                }
            }
        });


        // map messageIds to conversationIds for unread count lookup
        const unreadMessages = await prisma.message.findMany({
            where: {
                id: { in: unreadCounts.map(u => u.messageId) }
            },
            select: {
                id: true,
                conversationId: true
            }
        });

        // build unread count map { conversationId: count }
        const unreadCountMap = unreadMessages.reduce((acc, msg) => {
            acc[msg.conversationId] = (acc[msg.conversationId] || 0) + 1;
            return acc;
        }, {});


        const formattedConversations = conversations.map((conv) => {
            const otherMembers = conv.members
                .filter(m => m.userId !== userId)
                .map(m => m.user);

            return {
                conversationId: conv.id,
                type: conv.type,
                latestMessage: conv.messages[0] || null,
                unreadCount: unreadCountMap[conv.id] || 0,
                members: otherMembers
            };
        });

        res
            .status(200)
            .json(new ApiResponse(200, 'Recent conversations fetched successfully', { conversations: formattedConversations }));

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to fetch recent conversations');
    }
});

export {
    createDirectConversation,
    getConverstionMessages,
    createConversationMessage,
    getRecentConversations
}