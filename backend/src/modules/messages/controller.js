import { prisma } from '../../db/index.js';
import { ApiError } from '../../utils/ApiError.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';

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
                .json(new ApiResponse(200, 'Direct conversation already exists', { id: existing.id, "type": "direct" }));
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
            .json(new ApiResponse(201, 'Direct conversation created successfully', { id: conversation.id, "type": "direct" }));

    } catch (error) {
        // if userId does not exist in the database, prisma will throw a foreign key constraint error with code P2003
        if (error.code === 'P2003') {
            throw new ApiError(404, 'User not found');
        }

        throw new ApiError(error.statusCode || 500, error.message || 'Failed to create direct conversation');
    }
});

export {
    createDirectConversation,
}