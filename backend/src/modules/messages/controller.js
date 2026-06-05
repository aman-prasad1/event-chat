import { MESSAGES_TOPIC } from '../../constants.js';
import { prisma } from '../../db/index.js';
import { kafkaProducer } from '../../kafka/index.js';
import { redisClient } from '../../redis/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { getSignedFileUrl, uploadToS3 } from '../../utils/s3.js';

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

        // clear redis cache for recent conversations of both users
        await redisClient.del(`conversation:${req.user?.id}`);
        await redisClient.del(`conversation:${userId}`);

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
            }),
            include: {
                statuses: true
            }
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

        } else {
            throw new ApiError(400, 'Unsupported message type');
        }

        const members = await prisma.conversationMember.findMany({
            where: { conversationId },
            select: { userId: true }
        });


        // produce message to Kafka topic for asynchronous processing
        await kafkaProducer.send({
            topic: MESSAGES_TOPIC,
            messages: [
                {
                    key: conversationId,
                    value: JSON.stringify({
                        conversationId,
                        senderId: req.user.id,
                        content: parsedContent,
                        type,
                        members
                    })
                }
            ]
        })

        res
            .status(202)
            .json(new ApiResponse(202, 'Message queued successfully'));
    } catch (error) {

        if (error.code === "P2003") {
            throw new ApiError(404, 'Conversation not found');
        }

        throw new ApiError(error.statusCode || 500, error.message || 'Failed to send message');
    }
});

const getRecentConversations = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?.id;
        const cacheKey = `conversation:${userId}`;

        const cachedConversations = await redisClient.get(cacheKey);

        if (cachedConversations) {
            return res
                .status(200)
                .json(new ApiResponse(200, 'Recent conversations fetched successfully', { conversations: JSON.parse(cachedConversations) }));
        }

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
                        createdAt: true,
                        statuses: true
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
            // acc[msg.conversationId] = (acc[msg.conversationId] || 0) + 1;
            acc[msg.conversationId] = [...(acc[msg.conversationId] || []), msg.id];
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
                unreadCount: unreadCountMap[conv.id]?.length || 0,
                unreadMessageIds: unreadCountMap[conv.id] || [],
                members: otherMembers
            };
        });


        // cache the recent conversations for 5 minutes
        await redisClient.set(
            cacheKey,
            JSON.stringify(formattedConversations),
            'EX',
            60 * 60 // 30 minutes
        );

        res
            .status(200)
            .json(new ApiResponse(200, 'Recent conversations fetched successfully', { conversations: formattedConversations }));

    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to fetch recent conversations');
    }
});

const getFileUrl = asyncHandler(async (req, res) => {
    try {
        const { conversationId, messageId } = req.query;

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

        const message = await prisma.message.findUnique({
            where: { id: messageId, conversationId },
            select: { content: true, type: true }
        });

        if (!message) {
            throw new ApiError(404, 'Message not found');
        }

        if (message.type !== 'file') {
            throw new ApiError(400, 'Message is not a file type');
        }

        const fileKey = message.content.file_key;

        // check redis cache for the file URL first
        const cacheKey = `fileUrl:${fileKey}`;
        const cachedUrl = await redisClient.get(cacheKey);
        if (cachedUrl) {
            return res
                .status(200)
                .json(new ApiResponse(200, 'File URL fetched successfully', { fileUrl: cachedUrl }));
        }

        const fileUrl = await getSignedFileUrl(fileKey, message.content.filename);

        if(!fileUrl) {
            throw new ApiError(500, 'Failed to generate file URL');
        }

        // cache the file URL for 1 hour
        await redisClient.set(cacheKey, fileUrl, 'EX', 60 * 60);

        res
            .status(200)
            .json(new ApiResponse(200, 'File URL fetched successfully', { fileUrl }));
    } catch (error) {
        throw new ApiError(error.statusCode || 500, error.message || 'Failed to fetch file URL');
    }
});

export {
    createConversationMessage,
    createDirectConversation,
    getConverstionMessages,
    getFileUrl,
    getRecentConversations
};
