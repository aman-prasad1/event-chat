import { prisma } from '../../db/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../../utils/cloudinary.js';
import { io, emitToUser } from '../../socketIo.js';
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

            // upload file to cloudinary
            const uploadResult = await uploadOnCloudinary(req.file.path, "chatFiles");
            if (!uploadResult || !uploadResult.url || !uploadResult.public_id) {
                throw new ApiError(500, 'Failed to upload file');
            }

            parsedContent = {
                filename: req.file.originalname,
                file_url: uploadResult.url,
                file_publicId: uploadResult.public_id,
                mimetype: req.file.mimetype,
                size: req.file.size
            };

            fs.unlink(req.file.path, (err) => {
                if(err) {
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

        for (const m of members) {
            if(m.userId === req.user.id) continue; // don't send the message to the sender
            emitToUser(m.userId, "message_received", {
                message
            });

            await prisma.messageStatus.create({
                data: {
                    messageId: message.id,
                    userId: m.userId,
                    status: 'sent'
                }
            })
        }

        res
            .status(201)
            .json(new ApiResponse(201, 'Message sent successfully', { "messageId": message.id }));
    } catch (error) {
        if (req.file) {
            // Ensure that the local file is deleted after processing
            fs.unlink(req.file.path, (err) => {
                if(err) {
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

export {
    createDirectConversation,
    getConverstionMessages,
    createConversationMessage
}